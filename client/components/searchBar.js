import React from 'react';

export default function (props) {
    let handleTextChange = function(e){
        props.handleTextChange(e.target.value);
    };
    let acceptLease = function(){
        props.acceptLease(props.text);
    };
    return (
        <div className="form-inline">
            <textarea
                className="form-control"
                type="text"
                value={props.text}
                onChange={handleTextChange}
                placeholder="Lease Number"
            />
            <button
                className="btn btn-success"
                disabled={props.text==""}
                onClick={acceptLease}
            >
                Add
            </button>
        </div>
    )
};