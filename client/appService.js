import $ from 'jquery';

let doPOST = (url, options, callback) => {
    $.ajax({
        type: "POST",
        url: url,
        data: options,
        cache: false,
        success: (data) => {
            callback(data)
        },
        error: function (xhr, status, err) {
            console.error(status, err.toString());
        }
    });
};

let doGET = (url, options, callback) => {
    $.ajax({
        type: "GET",
        url: url,
        data: options,
        cache: false,
        success: (data) => {
            callback(data)
        },
        error: function (xhr, status, err) {
            console.error(status, err.toString());
        }
    });
};

export default {
    getLeases: (options, callback) => {
        doGET("/getLeases", options, callback);
    },

    getRelatedData: (options, callback) => {
        doGET("/getRelated", options, callback);
    },

    getMaxValues: (options, callback) => {
        doGET('/getMaxValues', options, callback);
    },

    commit: (options, callback) => {
        doPOST('/commit', options, callback);
    }
}