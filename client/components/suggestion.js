import React from 'react';

export default function (props) {
    let onClick = function (e) {
        props.acceptLease(props.data.name);
    };
    return (
        <button type="button" className="list-group-item suggestion" onClick={onClick}>
        <span className="badge">
            {props.idx}
        </span>
            {props.data.name}
        </button>
    )
};