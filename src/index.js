import React from 'react';
import { render } from 'react-dom';
import d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import './layout';

ReactFauxDOM.Element.prototype.hasAttribute = function(name) {
  var value = this.getAttribute(name);
  console.log('hasAttribute', name, value, this);
  return typeof value !== 'undefined';
};

function App() {

  const svg = ReactFauxDOM.createElement('svg');
  const app = d3.select(svg).attr('width', 800).attr('heigth', 400);
  app.layout({
    width: 800,
    height: 400,
  });

  app.append('g').layout({
    height: 80,
  });

  app.append('g').layout({
    height: 50,
  });

  app.append('g').layout({
    flex: 1,
  });
  app.layout();

  const c10 = d3.scale.category10();

  app.selectAll("g").filter(function(d) {
    // FIXME
    //return this.childElementCount === 0;
    return true;
  })
  .append('rect').attr('fill', function(d, i) { return c10(i); })
  .attr('width', function() {
    return this.parentNode.getAttribute('layout-width')}
  )
  .attr('height', function() {
    return this.parentNode.getAttribute('layout-height')}
  );

  return svg.toReact();
}

render(<App />, document.getElementById('app'));
