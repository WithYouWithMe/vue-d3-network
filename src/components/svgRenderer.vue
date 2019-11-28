<template lang="pug">
  svg(
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink= "http://www.w3.org/1999/xlink"
    ref="svg"
    :width="size.w"
    :height="size.h"
    class="net-svg"
    @mouseup='emit("dragEnd",[$event])'
    @touchend.passive='emit("dragEnd",[$event])'
    @touchstart.passive=''
    )

    //-> links
    g.links#l-links
        path(v-for="link in links"
          :d="linkPath(link)"
          :id="link.id"
          @click='emit("linkClick",[$event,link])'
          @touchstart.passive='emit("linkClick",[$event,link])'
          v-bind='linkAttrs(link)'
          :class='linkClass(link.id)'
          :style='linkStyle(link)'
          )

    //- -> nodes
    g.nodes#l-nodes(v-if='!noNodes')
      foreignObject.node(
        v-for='(node,key) in nodes'
        :x="node.x - getNodeSize(node, 'width') / 2"
        :y="node.y - getNodeSize(node, 'height') / 2"
        :width="getNodeSize(node, 'width')"
        :height="getNodeSize(node, 'height')"
        :key='key'
        @click='emit("nodeClick",[$event,node])'
        @touchend.passive='emit("nodeClick",[$event,node])'
        @mousedown.prevent='emit("dragStart",[$event,key])'
        @touchstart.prevent='emit("dragStart",[$event,key])'
        :style='nodeStyle(node)'
        :title="node.name"
        :class='nodeClass(node,["node-svg"])'
        v-html="node.html"
      )

    //-> Links Labels
    g.labels#link-labels(v-if='linkLabels')
      text.link-label(v-for="link in links" :font-size="fontSize" )
        textPath(v-bind:xlink:href="'#' + link.id" startOffset= "50%") {{ link.name }}

    //- -> Node Labels
    g.labels#node-labels( v-if="nodeLabels")
      text.node-label(v-for="node in nodes"
        :x='node.x + (getNodeSize(node) / 2) + (fontSize / 2)'
        :y='node.y + labelOffset.y'
        :font-size="fontSize"
        :class='(node._labelClass) ? node._labelClass : ""'
        :stroke-width='fontSize / 8'
      ) {{ node.name }}
</template>

<script>
import svgExport from "../lib/js/svgExport";
import { getDimensions } from "../lib/js/dimensions";

export default {
  name: "SvgRenderer",
  props: [
    "size",
    "nodes",
    "noNodes",
    "selected",
    "linksSelected",
    "links",
    "nodeSize",
    "padding",
    "fontSize",
    "strLinks",
    "linkWidth",
    "nodeLabels",
    "linkLabels",
    "labelOffset",
    "nodeSym",
  ],
  methods: {
    getNodeSize(node, side) {
      let result = node.dimensions;

      if (!result) {
        result = getDimensions(node.html, {}, "");
        node.dimensions = result;
        console.log(node.html, result);
      }

      return result[side];
    },
    emit(e, args) {
      this.$emit("action", e, args);
    },
    svgScreenShot(cb, toSvg, background, allCss) {
      const svg = svgExport.export(this.$refs.svg, allCss);
      if (!toSvg) {
        if (!background) background = this.searchBackground();
        const canvas = svgExport.makeCanvas(this.size.w, this.size.h, background);
        svgExport.svgToImg(svg, canvas, (err, img) => {
          if (err) cb(err);
          else cb(null, img);
        });
      } else {
        cb(null, svgExport.save(svg));
      }
    },
    linkClass(linkId) {
      const cssClass = ["link"];

      // eslint-disable-next-line no-prototype-builtins
      if (this.linksSelected.hasOwnProperty(linkId)) {
        cssClass.push("selected");
      }
      if (!this.strLinks) {
        cssClass.push("curve");
      }
      return cssClass;
    },
    linkPath(link) {
      const d = {
        M: [link.source.x | 0, link.source.y | 0],
        X: [link.target.x | 0, link.target.y | 0],
      };
      if (this.strLinks) {
        return `M ${d.M.join(" ")} L${d.X.join(" ")}`;
      } else {
        d.Q = [link.source.x, link.target.y];
        return `M ${d.M} Q ${d.Q.join(" ")} ${d.X}`;
      }
    },
    nodeStyle(node) {
      return (node._color) ? `fill: ${node._color}` : "";
    },
    linkStyle(link) {
      const style = {};
      if (link._color) style.stroke = link._color;
      return style;
    },
    nodeClass(node, classes = []) {
      let cssClass = (node._cssClass) ? node._cssClass : [];
      if (!Array.isArray(cssClass)) cssClass = [cssClass];
      cssClass.push("node");
      classes.forEach(c => cssClass.push(c));
      if (this.selected[node.id]) cssClass.push("selected");
      if (node.fx || node.fy) cssClass.push("pinned");
      return cssClass;
    },
    searchBackground() {
      let vm = this;
      while (vm.$parent) {
        const style = window.getComputedStyle(vm.$el);
        const background = style.getPropertyValue("background-color");
        const rgb = background.replace(/[^\d,]/g, "").split(",");
        const sum = rgb.reduce((a, b) => parseInt(a) + parseInt(b), 0);
        if (sum > 0) return background;
        vm = vm.$parent;
      }
      return "white";
    },
    spriteSymbol() {
      const svg = this.nodeSym;
      if (svg) {
        return svgExport.toSymbol(svg);
      }
    },
    linkAttrs(link) {
      const attrs = link._svgAttrs || {};
      attrs["stroke-width"] = attrs["stroke-width"] || this.linkWidth;
      return attrs;
    },
  },
};
</script>
