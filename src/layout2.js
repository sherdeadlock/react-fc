import computeLayout from 'css-layout';
import d3 from 'd3';
import innerDimensions from './innerDimensions';
import ReactFauxDOM from 'react-faux-dom';

ReactFauxDOM.Element.prototype.hasAttribute = function(name) {
  var value = this.getAttribute(name);
  return typeof value !== 'undefined';
};

function ownerSVGElement(node) {
    while (node.ownerSVGElement) {
        node = node.ownerSVGElement;
    }
    return node;
}

// parses the style attribute, converting it into a JavaScript object
function parseStyle(style) {
    if (!style) {
        return {};
    }
    var properties = style.split(';');
    var json = {};
    properties.forEach(function(property) {
        var components = property.split(':');
        if (components.length === 2) {
            var name = components[0].trim();
            var value = components[1].trim();
            json[name] = isNaN(value) ? value : Number(value);
        }
    });
    return json;
}

// creates the structure required by the layout engine
function createNodes(el) {
    function getChildNodes() {
        var children = [];
        for (var i = 0; i < el.childNodes.length; i++) {
            var child = el.childNodes[i];
            if (child.nodeType === 1) {
                if (child.getAttribute('data-layout-style')) {
                    children.push(createNodes(child));
                }
            }
        }
        return children;
    }
    return {
        style: parseStyle(el.getAttribute('data-layout-style')),
        children: getChildNodes(el),
        element: el
    };
}

// takes the result of layout and applied it to the SVG elements
function applyLayout(node, subtree) {
    // don't set layout-width/height on layout root node
    if (subtree) {
        node.element.setAttribute('data-layout-width', node.layout.width);
        node.element.setAttribute('data-layout-height', node.layout.height);
    }
    node.element.setAttribute('data-layout-x', node.layout.left);
    node.element.setAttribute('data-layout-y', node.layout.top);
    if (node.element.nodeName.match(/(?:svg|rect)/i)) {
        node.element.setAttribute('width', node.layout.width);
        node.element.setAttribute('height', node.layout.height);
        node.element.setAttribute('x', node.layout.left);
        node.element.setAttribute('y', node.layout.top);
    } else {
        node.element.setAttribute('transform',
            'translate(' + node.layout.left + ', ' + node.layout.top + ')');
    }
    node.children.forEach(function(childNode) {
        applyLayout(childNode, true);
    });
}

function computeDimensions(node) {
    if (node.hasAttribute('data-layout-width') && node.hasAttribute('data-layout-height')) {
        return {
            width: Number(node.getAttribute('data-layout-width')),
            height: Number(node.getAttribute('data-layout-height'))
        };
    } else {
        return innerDimensions(node);
    }
}

function computePosition(node) {
    if (node.hasAttribute('data-layout-x') && node.hasAttribute('data-layout-y')) {
        return {
            x: Number(node.getAttribute('data-layout-x')),
            y: Number(node.getAttribute('data-layout-y'))
        };
    } else {
        return { x: 0, y: 0 };
    }
}

function layout(node) {
    if (ownerSVGElement(node).__layout__ === 'suspended') {
        return;
    }

    var dimensions = computeDimensions(node);

    var position = computePosition(node);

    // create the layout nodes
    var layoutNodes = createNodes(node);

    // set the dimensions / position of the root
    layoutNodes.style.width = dimensions.width;
    layoutNodes.style.height = dimensions.height;
    layoutNodes.style.left = position.x;
    layoutNodes.style.top = position.y;

    // use the Facebook CSS goodness
    computeLayout(layoutNodes);

    // apply the resultant layout
    applyLayout(layoutNodes);
}

function layoutSuspended(x) {
    if (!arguments.length) {
        return Boolean(ownerSVGElement(this.node()).__layout__);
    }
    return this.each(function() {
        ownerSVGElement(this).__layout__ = x ? 'suspended' : '';
    });
}

d3.selection.prototype.layoutSuspended = layoutSuspended;
d3.transition.prototype.layoutSuspended = layoutSuspended;

function layoutSelection(name, value) {
    var argsLength = arguments.length;

    // For layout(string), return the lyout value for the first node
    if (argsLength === 1 && typeof name === 'string') {
        var node = this.node();
        return Number(node.getAttribute('data-layout-' + name));
    }

    // for all other invocations, iterate over each item in the selection
    return this.each(function() {
        if (argsLength === 2) {
            if (typeof name !== 'string') {
                // layout(number, number) - sets the width and height and performs layout
                this.setAttribute('data-layout-width', name);
                this.setAttribute('data-layout-height', value);
                layout(this);
            } else {
                // layout(name, value) - sets a layout- attribute
                this.setAttribute('data-layout-style', name + ':' + value);
            }
        } else if (argsLength === 1) {
            if (typeof name !== 'string') {
                // layout(object) - sets the layout-style property to the given object
                var styleObject = name;
                var layoutCss = Object.keys(styleObject)
                    .map(function(property) {
                        return property + ':' + styleObject[property];
                    })
                    .join(';');
                this.setAttribute('data-layout-style', layoutCss);
            }
        } else if (argsLength === 0) {
            // layout() - executes layout
            layout(this);
        }
    });
}

d3.selection.prototype.layout = layoutSelection;
d3.transition.prototype.layout = layoutSelection;
