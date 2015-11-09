import React from 'react';
import { render } from 'react-dom';
import d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import './layout';

// FIXME
ReactFauxDOM.Element.prototype.hasAttribute = function(name) {
  var value = this.getAttribute(name);
  console.log('hasAttribute', name, value, this);
  return typeof value !== 'undefined';
};

function App({width, height}) {
  width = width || 800;
  height = height || 600;

  const svg = ReactFauxDOM.createElement('svg');

  const app = d3.select(svg);

  app.append('g').layout({
    height: 80
  });

  app.append('g').layout({
    height: 50
  });

  app.append('g').layout({
    flex: 1
  });

  // FIXME https://github.com/Olical/react-faux-dom/issues/28#issuecomment-154790570
  // Set default layout-width and layout-height,
  // or it get the width and height from stylesheet.
  app.layout(width, height);

  const c10 = d3.scale.category10();

  app.selectAll("g")
    .filter(function(d) {
      // FIXME
      //return this.childElementCount === 0;
      return true;
    })
    .append('rect')
    .attr('fill', function(d, i) {
      return c10(i);
    })
    .attr('width', function() {
      return this.parentNode
        .getAttribute('layout-width')
    })
    .attr('height', function() {
      return this.parentNode
        .getAttribute('layout-height')
    });

  return app.node().toReact();
}

render(<App width={500} height={500} />, document.getElementById('app'));
