export default {
  NS: "http://www.w3.org/2000/svg",
  // svgOrg: svg element
  // allCss : true includes all svg css styles, false includes only matched styles
  export(svgOrg, allCss) {
    let svg = null;
    if (this.isSvgData(svgOrg)) {
      svg = svgOrg.cloneNode(true);
      const childs = svgOrg.parentNode.querySelectorAll("*");
      const cssStyle = {};
      const rules = this.getcssRules();

      for (const child of childs) {
        let elRules = rules;
        if (!allCss) {
          elRules = rules.filter(rule => {
            return child.matches(rule.selectorText);
          });
        }
        for (const rule of elRules) {
          cssStyle[rule.selectorText] = rule.cssText;
        }
      }
      const css = Object.values(cssStyle).join("\n");
      if (css) {
        const style = document.createElementNS(this.NS, "style");
        style.type = "text/css";
        svg.insertBefore(style, svg.childNodes[0]);
        style.innerHTML = css;
        svg.appendChild(style);
      }
    }
    return svg;
  },

  makeCanvas(width, height, background) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = background || "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  },

  serialize(svg) {
    return (new XMLSerializer()).serializeToString(svg);
  },

  svgToImg(svg, canvas, cb) {
    const xml = this.serialize(svg);
    const img = new Image();
    const ctx = canvas.getContext("2d");
    img.onload = function() {
      ctx.drawImage(this, 0, 0);
      const png = canvas.toDataURL("image/png");
      cb(null, png, ctx);
    };
    img.onerror = function(err) {
      cb(err);
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;
  },

  save(svg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(this.serialize(svg))}`;
  },

  getcssRules() {
    const rules = [];
    for (const styles of document.styleSheets) {
      const styleRules = this.readRules(styles);
      for (const rule of styleRules) {
        if (rule && rule.cssText) {
          rules.push(rule);
        }
      }
    }
    return rules;
  },

  readRules(styles) {
    try {
      if (!styles.cssRules) return styles.rules || [];
    } catch (e) {
      // Firefox returns Security Error if stylesheet originates from different domain
      if (e.name !== "SecurityError") throw e;
      return [];
    }
    return styles.cssRules;
  },

  toDom(svgData) {
    const div = document.createElement("div");
    div.innerHTML = svgData;
    return div.firstChild || null;
  },

  toObject(svg) {
    if (svg) {
      const attrs = {};
      if (svg.attributes) {
        for (let i = svg.attributes.length; i >= 0; i--) {
          const a = svg.attributes[i];
          if (a) attrs[a.name] = a.value;
        }
      }
      const data = svg.innerHTML;
      if (data) return { attrs, data };
    }
    return null;
  },

  svgElFromString(svgData) {
    const svgEl = this.toDom(svgData);
    if (!this.isSvgData(svgEl)) return;
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return svgEl;
  },

  svgDataToUrl(svgData, attrs) {
    if (typeof (attrs) === "object") {
      for (const a in attrs) {
        const attribute = (attrs[a]) ? (attrs[a]) : "";
        svgData.setAttribute(a, attribute);
      }
    }
    const svg = this.export(svgData);
    if (svg) return this.svgToUrl(this.serialize(svg));
    return null;
  },

  isSvgData(svgData) {
    if (!svgData.firstChild) return false;
    return (svgData.firstChild.parentNode.nodeName === "svg");
  },

  svgToUrl(svg) {
    const xml = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(xml);
    return url;
  },
};
