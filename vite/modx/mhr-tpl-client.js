import.meta.hot.on("tpl-changed", async function ({ src, content }) {
  updateComponentHTML(src, content);
});

function updateComponentHTML(componentSrc, html) {
  const componentsNodes = getComponentsNodes(componentSrc);

  componentsNodes.forEach((component, i) => {
    let tmpElement = document.createElement("div");
    tmpElement.innerHTML = `<!-- begin ${componentSrc} -->\n${html}`;

    component.innerNodes.forEach((node, j) => node.remove());
    component.begin.replaceWith(...tmpElement.childNodes);

    tmpElement = null;
  });
}

function getComponentsNodes(componentSrc) {
  const componentsNodes = [];
  const allComments = getHTMLComments(document.body);
  const beginComments = allComments.filter(
    (c) => c.data.trim() === `begin ${componentSrc}`,
  );

  beginComments.forEach((beginComment, i) => {
    if (!componentsNodes[i]) componentsNodes[i] = {};

    componentsNodes[i].begin = beginComment;
    componentsNodes[i].innerNodes = [];
    componentsNodes[i].end = null;

    let currentNode = beginComment.nextSibling;
    for (let j = 0; j < 100; j++) {
      currentNode = currentNode.nextSibling;
      if (
        currentNode.nodeName === "#comment" &&
        currentNode.data.trim() === `end ${componentSrc}`
      ) {
        break;
      }

      componentsNodes[i].innerNodes.push(currentNode);
    }

    componentsNodes[i].end = currentNode;
  });

  return componentsNodes;
}

function getHTMLComments(node) {
  const xPath = "//comment()";
  const result = [];

  let query = document.evaluate(
    xPath,
    node,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null,
  );
  for (let i = 0, length = query.snapshotLength; i < length; ++i) {
    result.push(query.snapshotItem(i));
  }

  return result;
}
