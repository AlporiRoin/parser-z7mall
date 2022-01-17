const express = require('express');
const body_parser = require('body-parser');

const robot = require('./robot/robot.js');

const app = express( );

app.use( body_parser.json( ) );
app.use( body_parser.urlencoded( ) );

app.listen( 53425, ( ) => {

    robot.FullScan( );

    setInterval(( ) => {
        
        robot.Checking__Directories( );

    }, 600000);

    setInterval(( ) => {

        robot.Weekly__Check( );

    }, 604800000);


    console.log( 'Сервер начал работу!' );
});