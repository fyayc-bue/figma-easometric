const { skewDEG, rotateDEG, compose } = require("transformation-matrix");

let selection = figma.currentPage.selection;

if (selection.length !== 1) {
  figma.closePlugin("Select a single node.");
}

function getOptions(direction) {
  switch (direction) {
    case "left":
      return {
        rotate: 0,
        skew: 30,
        degree: -30,
      };
      break;
    case "right":
      return {
        rotate: 0,
        skew: -30,
        degree: 30,
      };
      break;
    case "top-left":
      return {
        rotate: 0,
        skew: -30,
        degree: -30,
      };
      break;
    case "top-right":
      return {
        rotate: 90,
        skew: -30,
        degree: 30,
      };
      break;
    default:
      return {
        rotate: 0,
        skew: 0,
        degree: 0,
      };
      break;
  }
}

function setIsomentric(node, direction) {
  let options = getOptions(direction),
    matrix = compose(rotateDEG(options.rotate), skewDEG(0, options.skew)),
    x = node.x,
    y = node.y;

  node.relativeTransform = [
    [matrix.a, matrix.b, matrix.e],
    [matrix.c, matrix.d, matrix.f],
  ];
  node.rotation = options.degree;

  node.x = x;
  node.y = y;

  node.setPluginData("direction", direction);

  return node;
}

function setActive(selection) {
  if (selection.length !== 1) {
    return false;
  }
  return selection[0].getPluginData("direction") || false;
}

if (figma.command == "modal") {
  figma.showUI(__html__, {
    width: 320,
    height: 328,
    themeColors: true,
  });

  figma.on("selectionchange", () => {
    selection = figma.currentPage.selection;
    if (selection.length !== 1) {
      figma.closePlugin("Select a single node.");
    }
    figma.ui.postMessage({
      type: "setActive",
      active: setActive(selection),
    });
  });

  figma.ui.postMessage({
    type: "setActive",
    active: setActive(selection),
  });

  figma.clientStorage.getAsync("easometricClose").then((bool) => {
    bool = bool === undefined ? true : bool;
    figma.ui.postMessage({
      type: "setToggle",
      bool: bool,
    });
  });

  figma.ui.onmessage = (response) => {
    if (response.type == "set") {
      figma.clientStorage.getAsync("easometricClose").then((bool) => {
        bool = bool === undefined ? true : bool;
        setIsomentric(selection[0], response.direction);
        if (bool) {
          figma.closePlugin("Isometric set.");
        }
      });
    }

    if (response.type == "toggle") {
      figma.clientStorage
        .setAsync("easometricClose", response.bool)
        .then(() => {
          figma.notify(
            response.bool
              ? "Modal will close after selection."
              : "Modal will stay after selection."
          );
        });
    }
  };
} else {
  setIsomentric(selection[0], figma.command);
  figma.closePlugin("Isometric set.");
}
