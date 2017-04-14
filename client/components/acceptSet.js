import React from 'react';
let ClipboardBtn = require('react-clipboard.js');

let Acceptance = function (props) {
    let toggleStale = function (e) {
        console.log("Toggling " + e.target.id);
        props.toggleStale(e.target.id);
    };

    return (
        <li className={'item ' + props.data.stale===1?'stale':'fresh'}>
            <div className="" onClick={toggleStale} id={props.id.toString()}>
                {props.data.name}
            </div>
        </li>
    );
};

// AcceptSet
export default function (props) {
    let copytext = props.data.filter(el => !el.stale).map(el => el.name).join('\n');
    let enableButton = props.data.some(el => !el.stale);
    return (
        <div className="accepted">
            {!props.data.length &&
                <h2>None Selected</h2>
            }
            <ol>
                {props.data.map((accept, i) => {
                    return <Acceptance key={i} data={accept} toggleStale={props.toggleStale} id={i}/>
                })}
            </ol>
            <ClipboardBtn
                button-className="btn btn-primary"
                button-onClick={props.commit}
                data-clipboard-text={copytext}
                button-disabled={!enableButton}>
                Kermit
            </ClipboardBtn>
        </div>
    );
};