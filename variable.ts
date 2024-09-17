// /*
//  ** =================
//  ** Utils - Variable Access
//  ** =================
//  */

// /* Gets all the local variables */
// let figmaVariables: Variable[] = [];
// let availableCollections: Record<string, string> = {};
// let selectedCollection: string;
// let availableModes: Record<string, string> = {};
// let selectedMode: string;

// async function initVariables(): Promise<void> {
//   figmaVariables = await figma.variables.getLocalVariablesAsync();
//   availableCollections = await listAllCollections(figmaVariables);
//   selectedCollection = Object.keys(availableCollections)[0];
//   availableModes = await modesOfCollection(selectedCollection);
//   selectedMode = Object.keys(availableModes)[0];
// }

// function variableByCurrentMode(variable: Variable): VariableValue {
//   if (selectedMode === null) {
//     throw new Error("No mode selected");
//   }
//   return variable.valuesByMode[selectedMode];
// }

// async function listAllCollections(
//   variables: Variable[]
// ): Promise<Record<string, string>> {
//   const collections: Record<string, string> = {};
//   for (const variable of variables) {
//     const collectionId = variable.variableCollectionId;
//     const collection = await figma.variables.getVariableCollectionByIdAsync(
//       collectionId
//     );
//     collections[collectionId] = collection?.name ?? collectionId;
//   }
//   return collections;
// }

// async function modesOfCollection(
//   collectionId: string
// ): Promise<Record<string, string>> {
//   const modes: Record<string, string> = {};
//   const collection = await figma.variables.getVariableCollectionByIdAsync(
//     collectionId
//   );
//   collection?.modes.forEach((mode) => {
//     modes[mode.modeId] = mode.name;
//   });
//   return modes;
// }

// /*
//  ** =================
//  ** Utils - Maths
//  ** =================
//  */

// /*
//  ** Converts a rgba color to hex
//  */
// function rgba2hex(orig: any) {
//   let a;
//   const rgb = orig
//       .replace(/\s/g, "")
//       .match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
//     alpha = ((rgb && rgb[4]) || "").trim();
//   let hex = rgb
//     ? (rgb[1] | (1 << 8)).toString(16).slice(1) +
//       (rgb[2] | (1 << 8)).toString(16).slice(1) +
//       (rgb[3] | (1 << 8)).toString(16).slice(1)
//     : orig;

//   if (alpha !== "") {
//     a = alpha;
//   } else {
//     a = 0o1;
//   }
//   a = ((a * 255) | (1 << 8)).toString(16).slice(1);
//   hex = hex + a;

//   return "#" + hex.toUpperCase();
// }

// /*
//  ** Converts a rgba JavaScript object to a CSS hexa string
//  */
// function rgbaObjectToCSSHexaString(obj: {
//   r: number;
//   g: number;
//   b: number;
//   a: number;
// }): string {
//   const { r, g, b, a } = obj;
//   const rgbaString = rgba2hex(
//     `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
//       b * 255
//     )}, ${a})`
//   );
//   return rgbaString;
// }

// /*
//  ** =================
//  ** Utils - Converters
//  ** =================
//  */

// /*
//  ** Converts a CSS property to camelCase
//  */
// function cssPropertyToCamelCase(cssProperty: string): string {
//   const matches = cssProperty.match(/--(\w+(-\w+)*)/);
//   if (matches && matches.length > 1) {
//     const propertyName = matches[1];
//     return propertyName.replace(/-(.)/g, (_, letter) => letter.toUpperCase());
//   }
//   return "";
// }

// /*
//  ** Converts a CSS property to JavaScript const
//  */
// function cssPropertyToJSConst(propertyString: string): string {
//   propertyString = propertyString.trim();

//   const matches = propertyString.match(/--(.+):\s*(.+);/);
//   if (!matches || matches.length !== 3) {
//     throw new Error("Invalid CSS property string");
//   }

//   const propertyName = matches[1];
//   let propertyValue = matches[2];

//   if (propertyValue.startsWith("var(--")) {
//     propertyValue = cssPropertyToCamelCase(propertyValue);
//   } else {
//     propertyValue = `'${propertyValue}'`;
//   }

//   const camelCaseName = propertyName.replace(/-(\w)/g, (_, letter) =>
//     letter.toUpperCase()
//   );
//   const jsConstantString = `export const ${camelCaseName} = ${propertyValue};`;

//   return jsConstantString;
// }

// /*
//  ** =================
//  ** Utils - Generators
//  ** =================
//  */

// /*
//  ** Generates a CSS key string
//  */
// function generatesCSSKeyString(variable: Variable): string {
//   return (
//     "--" +
//     variable.name
//       .replace(/\//g, "-")
//       .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
//       .toLowerCase()
//   );
// }

// /*
//  ** Generates a CSS value string
//  */
// function generatesCSSValueString(variable: Variable): string {
//   const value: any = variableByCurrentMode(variable);

//   if (value.type === "VARIABLE_ALIAS") {
//     const alias = <Variable>figmaVariables.find((obj) => obj.id === value.id);
//     return `var(${generatesCSSKeyString(alias)})`;
//   } else if (variable.resolvedType === "COLOR") {
//     return rgbaObjectToCSSHexaString(value);
//   } else {
//     return value + "px";
//   }
// }

// /*
//  ** =================
//  ** Figma plugin
//  ** =================
//  */

// function postUiUpdate() {
//   /* Prepare variables for code generation */
//   let cssFile = ":root {\n";
//   let jsFile = "";

//   const variablesForCurrentMode = figmaVariables
//     .filter((variable) => variable.variableCollectionId === selectedCollection)
//     .filter(
//       (variable) => variable.valuesByMode[selectedMode ?? ""] !== undefined
//     );
//   /* Filters variables to only get COLOR & FLOAT resolved types sorted alphabetically */
//   const filteredFigmaVariables = variablesForCurrentMode
//     .filter(
//       (variable) =>
//         variable.resolvedType === "COLOR" || variable.resolvedType === "FLOAT"
//     )
//     .sort((a, b) => a.name.localeCompare(b.name));

//   /* Iterates through variables to generate CSS & JS variables */
//   filteredFigmaVariables
//     .map(
//       (variable) =>
//         `  ${generatesCSSKeyString(variable)}: ${generatesCSSValueString(
//           variable
//         )};`
//     )
//     .forEach((variable) => {
//       cssFile += variable + "\n";
//       jsFile += cssPropertyToJSConst(variable) + "\n";
//     });
//   cssFile += "}";

//   /* Sends new data to UI (index.html) */
//   // figma.ui.postMessage({
//   //   cssFile,
//   //   jsFile,
//   //   collections: availableCollections,
//   //   modes: availableModes,
//   // });
// }

// async function init() {
//   await initVariables();
//   postUiUpdate();
// }
// init();

// figma.codegen.on("generate", async ({ node }) => {
//   console.log(node);
//   return [
//     {
//       title: "css object",
//       code: "dldldl",
//       language: "JAVASCRIPT",
//     },
//   ];
// });

// // /* Handle ui events triggered from UI (index.html) */
// // // figma.ui.onmessage = async (message) => {
// // //   if (message.type === "code-copied-css") {
// // //     figma.notify("CSS variables successfully copied to clipboard");
// // //   }
// // //   if (message.type === "code-copied-js") {
// // //     figma.notify("JavaScript variables successfully copied to clipboard");
// // //   }
// // //   if (message.type === "code-copied-compose") {
// // //     figma.notify("Compose variables successfully copied to clipboard");
// // //   }
// // //   if (message.type === "code-copied-swiftui") {
// // //     figma.notify("SwiftUI variables successfully copied to clipboard");
// // //   }
// // //   if (message.type === "collection-selected") {
// // //     selectedCollection = message.value;
// // //     if (selectedCollection === null) {
// // //       throw new Error("No collection selected");
// // //     }
// // //     availableModes = await modesOfCollection(selectedCollection);
// // //     selectedMode = Object.keys(availableModes)[0];
// // //     postUiUpdate();
// // //   }
// // //   if (message.type === "mode-selected") {
// // //     selectedMode = message.value;
// // //     postUiUpdate();
// // //   }
// // // };

// // // type CSS = {
// // //   [key: string]: string;
// // // };

// // /*
// // const getNodeStyles = async () => {
// //   // await figma.loadAllPagesAsync();
// //   const filterdNodes = figma.root;
// //   console.log(figma.root);
// //   // Array.from(filterdNodes).forEach((n) => {
// //   //   if (typeof n.cornerRadius === "number") {
// //   //     const value = n.cornerRadius < 99 ? n.cornerRadius : 999;
// //   //     radii.add(value);
// //   //   }
// //   // });
// //   // const radiiArray = [...radii].sort((a, b) => a - b);
// //   // const finalRadii = [];
// //   // // const position = radiiArray.indexOf(16);
// //   // radiiArray.forEach((radius) => {
// //   //   // const n = calculatePosition(i, position, radiiArray.length);
// //   //   // Rename base to default
// //   //   // const value = radius > 98 ? '9999px' : `${radius / 16}rem`;
// //   //   const value = Number(radius);
// //   //   const name = "";
// //   //   finalRadii.push({ name, value });
// //   // });
// //   // // Add default none
// //   // finalRadii.unshift({ name: "none", value: 0 });
// //   // return { finalRadii };
// // };

// // const kebabToCamelCase = (str: string): string =>
// //   str.replace(/-([a-z])/g, (_match, char) => char.toUpperCase());

// // const addQuotesIfNeeded = (value: string): string => {
// //   return isNaN(parseFloat(value)) || !isFinite(value as any)
// //     ? `"${value}"`
// //     : value;
// // };

// // const cssObjectToCssString = (cssObject: CSS): string => {
// //   let result = "{\n";

// //   for (const property of Object.keys(cssObject)) {
// //     const value = cssObject[property];
// //     const camelCaseProperty = kebabToCamelCase(property);
// //     const quotedValue = addQuotesIfNeeded(value);
// //     result += `\t${camelCaseProperty}: ${quotedValue},\n`;
// //   }

// //   return result + "}";
// // };

// // const genCssStr = async (node: SceneNode): Promise<string> => {
// //   const css = await node.getCSSAsync();

// //   console.log(css);
// //   return cssObjectToCssString(css);
// // };

// // // const getDSComponent = async (node: SceneNode): Promise<string> => {

// // //   const test = await node.getDevResourcesAsync(); // dev resource에 있는 정보

// // // if (node.type === "INSTANCE") {
// // //   const variants = node.componentProperties;
// // //   console.log(variants);

// // //   const component = await node.getMainComponentAsync(); // instance node의 원본 컴포넌트 가져오기?
// // //   console.log(component);
// // //   console.log(component?.parent);

// // //   if (component) {
// // //     // 원본 컴포넌트의 이름
// // //     const componentName = component.name;
// // //     console.log("Component Name:", componentName);
// // //   }
// // // }

// // //   console.log(test);

// // //   return test;
// // // };

// // if (figma.editorType === "dev" && figma.mode === "codegen") {
// //   figma.codegen.on("generate", async ({ node }) => {
// //     const parentCss = await genCssStr(node);

// //     console.log(getNodeStyles());
// //     // const collections =
// //     //   await figma.variables.getLocalVariableCollectionsAsync();
// //     // const files = [];
// //     // for (const collection of collections) {
// //     //   console.log(collection);
// //     //   const { name, modes, variableIds } = collection;
// //     //   for (const variableId of variableIds) {
// //     //     const { name, resolvedType, valuesByMode } =
// //     //       await figma.variables.getVariableByIdAsync(variableId);
// //     //     console.log(name, resolvedType, valuesByMode);
// //     //   }
// //     //   // files.push(...(await processCollection(collection)));
// //     // }
// //     // const id = node.effectStyleId;
// //     // const style = await figma.getStyleByIdAsync(id);
// //     // const name = style.name;
// //     // console.log(name);

// //     return [
// //       {
// //         title: "css object",
// //         code: parentCss,
// //         language: "JAVASCRIPT",
// //       },
// //     ];
// //   });
// // }

// // // async function processCollection({ name, modes, variableIds }) {
// // //   const files = [];
// // //   for (const mode of modes) {
// // //     const file = { fileName: `${name}.${mode.name}.tokens.json`, body: {} };
// // //     for (const variableId of variableIds) {
// // //       const { name, resolvedType, valuesByMode } =
// // //         await figma.variables.getVariableByIdAsync(variableId);
// // //       const value = valuesByMode[mode.modeId];
// // //       if (value !== undefined && ["COLOR", "FLOAT"].includes(resolvedType)) {
// // //         let obj = file.body;
// // //         name.split("/").forEach((groupName) => {
// // //           obj[groupName] = obj[groupName] || {};
// // //           obj = obj[groupName];
// // //         });
// // //         obj.$type = resolvedType === "COLOR" ? "color" : "number";
// // //         if (value.type === "VARIABLE_ALIAS") {
// // //           const currentVar = await figma.variables.getVariableByIdAsync(
// // //             value.id
// // //           );
// // //           obj.$value = `{${currentVar.name.replace(/\//g, ".")}}`;
// // //         } else {
// // //           obj.$value = resolvedType === "COLOR" ? rgbToHex(value) : value;
// // //         }
// // //       }
// // //     }
// // //     files.push(file);
// // //   }
// // //   return files;
// // // }
