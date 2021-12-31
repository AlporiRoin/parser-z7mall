const request = require('request');
const cheerio = require('cheerio');
const { Pool } = require('pg');

const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'parser_z7mall',
    password: 'HikigayaHachiman'
});

let storage = {
    data_to_scan: [],
    pages_to_scan: []
};

function GettingDataToCollectInformation( ) {

    pool.connect( ( err, client, release ) => {

        if ( err ) {

            console.log( err );

        }

        client.query( 'SELECT url_addresses, name_catalog FROM data_to_scan;', ( err, res ) => {

            release( );

            if ( err ) {

                console.log( err );
    
            }

            for ( let row of res.rows ) {

                storage.data_to_scan.push( row );
    
            }

        });

    });

    return;

}


function CheckingTheExistenceOfTheDirectoryTable( name_catalog ) {

    pool.connect( ( err, client, release ) => {

        if ( err ) {

            console.log( err );

        }

        client.query( `SELECT EXISTS ( SELECT * 
            FROM information_schema.tables 
            WHERE table_name = '${ name_catalog }'
            AND table_schema = 'public')::int   AS  "column";`, ( err, res ) => {

                release( );

                if ( err ) {

                    console.log( err );
        
                }
    
                if ( res.rows.column === 0 ) {
    
                    return false;
    
                }
    
                if ( res.rows.column === 1 ) {
    
                    return true;
    
                }

        });

    });

}


function CreatingACatalogTable( name_catalog ) {

    pool.connect( ( err, client, release ) => {

        if ( err ) {

            console.log( err );

        }

        client.query( `CREATE TABLE "${ name_catalog }" (
            product_name VARCHAR(255) NOT NULL,
            product_price NUMERIC(10, 2) NOT NULL,
            product_description TEXT,
            product_features TEXT,
            product_photos TEXT NOT NULL
        );`, ( err, res ) => {

            release( );

            if ( err ) {

                console.log( err );
    
                return false;
    
            }
    
            if ( res ) {
    
                return true;
    
            }

        });

    });

}


function DetectingADirectoryTable ( name_catalog ) {

    let ExistenceOfTheTable = CheckingTheExistenceOfTheDirectoryTable( name_catalog );

    if ( ExistenceOfTheTable === true ) {

        return;

    }

    if ( ExistenceOfTheTable === false ) {

        CreatingACatalogTable( name_catalog );

        return;

    }

};


function DetectingTheFollowingLink( url_addresses ) {

    (async function() {
                async function launchChrome() {
                  return await chromeLauncher.launch({
                    chromeFlags: [
                      '--disable-gpu',
                      '--headless'
                    ]
                  });
                }
                const chrome = await launchChrome();
                const protocol = await CDP({
                  port: chrome.port
                });
                
                const {
                    DOM,
                    Page,
                    Emulation,
                    Runtime
                } = protocol;
                await Promise.all([Page.enable(), Runtime.enable(), DOM.enable()]);
        
                Page.navigate({
                    url: 'https://www.lazada.co.th/shop-mobiles/?spm=a2o4m.home.cate_1.1.11252a80A6i0i4'
                });
        
                let script1_result;
        
                Page.loadEventFired(async() => {
                    const request = "document.querySelector('.e5J1n').outerHTML";
        
                    const result = await Runtime.evaluate({
                        expression: request
                    });

                    const $ = cheerio.load( result.result.value );

                    const antPagination = $( 'ul[class=ant-pagination]' ).children();
                    let listOfLinkElements = [];
                    let listLink = [];

                    for ( let i = 0; i < antPagination.length; i++ ) {

                        listOfLinkElements.push( antPagination[`${ i }`] );

                    }

                    for ( link of listOfLinkElements ) {

                        listLink.push( link.children );

                    }

                    // const indexOfTheCurrentPage = antPagination.filter( li => { if (  ) });

                    // console.log( listLink );
                    console.log( listLink[3] );
        
                    protocol.close();
                    chrome.kill();
                });
                
            })();

}


function ScanningPages( url_addresses, name_catalog ) {

    console.log( url_addresses );

    request( url_addresses, ( err, res, body ) => {

        if ( err ) {

            console.log( err );

        }

        if ( body !== false ) {

            console.log( true );

        }

    });

}


function FullScan( ) {

    function Next( ) {

        for ( let catalog_object of storage.data_to_scan ) {

            DetectingADirectoryTable( catalog_object.name_catalog );

            DetectingPagesToScan( catalog_object.url_addresses );

            // ScanningPages( catalog_object.url_addresses, catalog_object.name_catalog );

        }

    }

    GettingDataToCollectInformation( );

    setTimeout( ( ) => {
        Next();
    }, 1000);

}

// function test( ) {

//     

// }

module.exports = { FullScan, DetectingTheFollowingLink };