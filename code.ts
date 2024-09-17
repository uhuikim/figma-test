type CSS = {
  [key: string]: string;
};

type Radii = {
  [key: string]: string;
};

const radii: Radii = {
  "2px": "xs",
  "4px": "sm",
  "8px": "md",
  "16px": "lg",
  "24px": "xl",
  "32px": "2xl",
  "9999px": "full",
};

const borderRadiusPattern =
  /^border-(top-(right|left)-|bottom-(right|left)-)?radius$/;

const borderPattern = /^border(-(top|bottom|right|left))?$/;

const kebabToCamelCase = (str: string): string =>
  str.replace(/-([a-z])/g, (_match, char) => char.toUpperCase());

const addQuotesIfNeeded = (value: string): string => {
  return isNaN(parseFloat(value)) || !isFinite(Number(value))
    ? `'${value}'`
    : value;
};

const checkEffectStyle = async (node: SceneNode) => {
  if (
    node.type === "STICKY" ||
    node.type === "CONNECTOR" ||
    node.type === "SLICE" ||
    node.type === "SHAPE_WITH_TEXT" ||
    node.type === "CODE_BLOCK" ||
    node.type === "WIDGET" ||
    node.type === "EMBED" ||
    node.type === "LINK_UNFURL" ||
    node.type === "MEDIA" ||
    node.type === "SECTION" ||
    node.type === "TABLE"
  ) {
    return [];
  }
  const id = node.effectStyleId;
  const style = await figma.getStyleByIdAsync(id);
  const name = style?.name;

  return name?.split("/") || [];
};

// CSS 객체를 문자열로 변환
const cssObjectToCssString = async (
  cssObject: CSS,
  node: SceneNode
): Promise<string> => {
  const [effectName, effectValue] = await checkEffectStyle(node);
  let result = "{\n";

  for (const property in cssObject) {
    let value = cssObject[property];

    if (borderRadiusPattern.test(property)) {
      const pattern = /var\(--([a-zA-Z0-9-_]+)(?:,.*)?\)/;
      const match = value.match(pattern);

      if (radii[value]) {
        value = radii[value];
      } else if (match) {
        const fullKey = match[1];
        const parts = fullKey.split("-");
        value = parts[parts.length - 1];
      }
    } else if (property === "box-shadow" && effectName === "elevation") {
      value = effectValue;
    } else if (borderPattern.test(property)) {
      const [width, style, color] = value.split(" ");
      const borderValue = `${width} ${style} token(colors.${color})`;
      value = borderValue;
    }

    const camelCaseProperty = kebabToCamelCase(property);
    const quotedValue = addQuotesIfNeeded(value);

    result += `\t${camelCaseProperty}: ${quotedValue},\n`;
  }

  return result + "}";
};

const genCssStr = async (node: SceneNode): Promise<string> => {
  const css = await node.getCSSAsync();
  return cssObjectToCssString(css, node);
};

if (figma.editorType === "dev" && figma.mode === "codegen") {
  figma.codegen.on("generate", async ({ node }) => {
    const parentCss = await genCssStr(node);

    return [
      {
        title: "css object",
        code: parentCss,
        language: "JAVASCRIPT",
      },
    ];
  });
}
