import type { Renderer } from "https://deno.land/x/fall_core@v0.3.0/mod.ts";
import { collect } from "https://deno.land/x/denops_std@v6.3.0/batch/mod.ts";
import { zip } from "https://deno.land/std@0.218.2/collections/zip.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.16.3/mod.ts";

const defaultUnknownIcon = "?";

const isOptions = is.StrictOf(is.PartialOf(is.ObjectOf({
  unknownIcon: is.String,
})));

const isPathDetail = is.ObjectOf({
  path: is.String,
});

export function getRenderer(
  options: Record<string, unknown>,
): Renderer {
  assert(options, isOptions);
  const unknownIcon = options.unknownIcon ?? defaultUnknownIcon;
  return {
    render: async (denops, items) => {
      const paths = items.map((v) => {
        if (isPathDetail(v.detail)) {
          return v.detail.path;
        }
        return "";
      });
      const icons = await collect(
        denops,
        (denops) =>
          paths.map((v) =>
            denops.call("nerdfont#find", v, false) as Promise<string>
          ),
      );
      return zip(items, icons).map(([item, icon]) => {
        const prefix = `${icon || unknownIcon}  `;
        const offset = getByteLength(prefix);
        const decorations = (item.decorations ?? []).map((v) => ({
          ...v,
          column: v.column + offset,
        }));
        return {
          ...item,
          decorations,
          label: `${prefix}${item.label ?? item.value}`,
        };
      });
    },
  };
}

function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}
