'use strict';

const convertFunction = require('mapbox-gl/src/style-spec/function/convert');
const {createExpression} = require('mapbox-gl/src/style-spec/expression');
const {isFunction} = require('mapbox-gl/src/style-spec/function');
const validate = require('mapbox-gl/src/style-spec').validate;
const spec = require('mapbox-gl/src/style-spec/reference/v8.json');

const stringify = require('json-stringify-pretty-compact');
const diff = require('diff');

const initialStyle = {
    version: 8,
    sources: {
        mapbox: {
            type: 'vector',
            url: 'mapbox://mapbox-streets-v7'
        }
    },
    layers: [{
        id: 'places',
        source: 'mapbox',
        'source-layer': 'poi_label',
        type: 'circle',
        paint: {
            'circle-radius': {
                property: 'scalerank',
                stops: [
                    [{zoom: 0, value: 0}, 1],
                    [{zoom: 0, value: 5}, 3],
                    [{zoom: 14, value: 0}, 5],
                    [{zoom: 14, value: 5}, 10]
                ]
            }
        }
    }]
};

class MigrationTool extends React.Component {
    constructor(props) {
        this.state = {
            inputStyle: stringify(initialStyle, null, 2)
        }

        this.onEdit = this.onEdit.bind(this);
    }

    render() {
        let diffOutput;
        let error;

        let validationErrors = validate(this.state.inputStyle);
        if (validationErrors.length === 0) {
            const parsed = JSON.parse(this.state.inputStyle)
            const migrated = migrate(parsed);
            const result = diff.diffLines(stringify(parsed), stringify(migrated));
            diffOutput = result.map((part, index) => {
                let klass = '';
                if (part.added) { klass ='bg-green-faint'; }
                if (part.removed) { klass='bg-red-faint'; }
                return <span key={index} className={klass}>{part.value}</span>
            });
            console.log(result);
        } else {
            error = validationErrors.map((error, index) => <div className='color-red-dark' key={index}>{error.line}: {error.message}</div>);
        }

        return (
        <div className='w-full grid grid--gut12 flex-parent--stretch-cross'>
            <div className='col col--12 col--auto-ml'>
                <div className='h-full px12'>
                    <h3 className="txt-h3">Original</h3>
                    <div className='w-full scroll-auto'>
                        <textarea cols={0} rows={25}
                            className='textarea'
                            value={this.state.inputStyle}
                            onChange={this.onEdit}
                        />
                    </div>
                </div>
            </div>
            <div className='col col--12 col--auto-ml'>
                <div className='h-full'>
                    <h3 className="txt-h3">Converted to expressions</h3>
                    {error || <div className="pre">{diffOutput}</div>}
                </div>
            </div>
        </div>)
    }

    onEdit(event) {
        const newValue = event.target.value;
        this.setState({inputStyle: newValue});
    }
}

function migrate(style) {
    const migrated = clone(style);
    migrated.layers = style.layers.map((layer) => {
        const migratedLayer = clone(layer);
        if (layer.paint) {
            migratedLayer.paint = migrateProperties(layer, 'paint');
        }
        if (layer.layout) {
            migratedLayer.layout = migrateProperties(layer, 'layout');
        }
        return migratedLayer;
    })
    return migrated;
}

function migrateProperties(layer, type) {
    const properties = clone(layer[type]);
    for (const key in properties) {
        if (isFunction(properties[key])) {
            const propertySpec = spec[`${type}_${layer.type}`][key];
            properties[key] = convertFunction(properties[key], propertySpec)
        }
    }
    return properties;
}

function clone(src) {
    return Object.assign({}, src)
}

module.exports = MigrationTool;
