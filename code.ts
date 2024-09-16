type CSS = {
  [key: string]: string;
};
const kebabToCamelCase = (str: string): string =>
  str.replace(/-([a-z])/g, (_match, char) => char.toUpperCase());

const addQuotesIfNeeded = (value: string): string => {
  return isNaN(parseFloat(value)) || !isFinite(value as any)
    ? `"${value}"`
    : value;
};

const cssObjectToCssString = (cssObject: CSS): string => {
  let result = "{\n";

  for (const property of Object.keys(cssObject)) {
    const value = cssObject[property];
    const camelCaseProperty = kebabToCamelCase(property);
    const quotedValue = addQuotesIfNeeded(value);
    result += `\t${camelCaseProperty}: ${quotedValue},\n`;
  }

  return result + "}";
};

const genCssStr = async (node: SceneNode): Promise<string> => {
  const css = await node.getCSSAsync();
  return cssObjectToCssString(css);
};

figma.codegen.on("generate", async (e: CodegenEvent) => {
  const node = e.node;

  if (node.type === "INSTANCE") {
    const variants = node.componentProperties;
    console.log(variants);

    const component = await node.getMainComponentAsync();
    console.log(component);
    console.log(component?.parent);

    if (component) {
      // 원본 컴포넌트의 이름
      const componentName = component.name;
      console.log("Component Name:", componentName);
    }
  }

  const parentCss = await genCssStr(node);

  return [
    {
      title: "css object",
      code: parentCss,
      language: "JAVASCRIPT",
    },
    {
      title: "IDS",
      code: parentCss,
      language: "JAVASCRIPT",
    },
  ];
});
