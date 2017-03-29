
//import {Timer} from 'NodeJS.Timer';
import React from 'react';

var Slider = function (props) {
    return (
        <div>
            <label>{props.desc}</label>
            <input
                className="slider"
                id={props.id}
                type="range"
                onChange={props.onAdjust}
                value={props.value}
                width="90%"
            />
            <span>
                {props.value}
            </span>
        </div>
    );
};


export default class extends  React.Component{

    constructor(props){
        super(props);
        this.state = {
            // TODO: move these default values to somewhere that makes sense
            relations: 100,
            recent: 70,
            totalUse: 40
        };
        this.componentDidMount = this.componentDidMount.bind(this);
        this.onAdjust = this.onAdjust.bind(this);
    }

    componentDidMount() {
        this.props.updateWeights(
            this.state.relations,
            this.state.recent,
            this.state.totalUse,
        );
    }

    onAdjust(e) {
        clearTimeout(this.timeoutID);
        this.state[e.target.id] = parseInt(e.target.value);
        this.forceUpdate(function(){
            this.timeoutID = setTimeout(this.props.updateWeights, 150,
                this.state.relations,
                this.state.recent,
                this.state.totalUse);
        });
    }

    render() {
        return (
            <form>
                <Slider id="relations" desc="Most historically associated with currently selected leases"
                        value={this.state.relations} onAdjust={this.onAdjust}/>
                <Slider id="recent" desc="Most recently used" value={this.state.recent} onAdjust={this.onAdjust}/>
                <Slider id="totalUse" desc="Most used" value={this.state.totalUse} onAdjust={this.onAdjust}/>
            </form>
        );
    }
};