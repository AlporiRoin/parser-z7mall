const request = require('request'),
      puppeteer = require('puppeteer'),
      fs = require('fs'),
      path = require('path'),
      axios = require('axios'),
      mysql = require('mysql'),
      download = require('image-downloader');

const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'HmK1qegiSOoJ72Ga',
    database : 'stage_rulazada'
});

let temporary_storage = {
    directory_links: [],
    crawl_links: [],
    product_links: [],
    catalog_products: []
}

function Output__To__The__Console ( color, string ) {

    let array_of_separators = [];

    for ( let separator = 0; separator <= ( string.length + 4 ); separator++ ) {

        array_of_separators.push( '-' );

    }

    array_of_separators.unshift( '*' );
    array_of_separators.unshift( '/' );
    array_of_separators.push( '*' );
    array_of_separators.push( '/' );

    let dividing_line = array_of_separators.join('');


    console.log( color, dividing_line );
    console.group( );
    console.group( );
    console.log( color, string );
    console.groupEnd( );
    console.groupEnd( );
    console.log( color, dividing_line );
    console.log( '\n' );
    console.log( '\n' );

}

function Preliminary__Actions ( ) {

    connection.connection();

    connection.query( 'SELECT * FROM catalogs;', ( err, result ) => {

        if ( err ) {
            console.error( result[0].solution );
        }

        Output__To__The__Console( "\x1b[32m", 'Получены данные о каталогах из базы данных' );

        for ( let row of result.rows ) {

            if ( row.name.indexOf( ' ' ) !== -1 ) {

                row.name = row.name.replace( ' ', '_' );

            }
            

            row.name = row.name.toLowerCase();

            const directory_location = path.join( __dirname, '../static/' , row.name );

            if ( !fs.existsSync( directory_location ) ) {

                fs.mkdirSync(( directory_location ), ( err ) => {
                    if ( err ) {
                        return console.error( err );
                    }
                });

            }

            row.directory_location = directory_location;

            connection.query( `CREATE TABLE if not exists "${ row.name }" (
                images TEXT NOT NULL,
                description TEXT NOT NULL,
                price VARCHAR( 10 ) NOT NULL,
                specifications TEXT
            );`, ( err, output ) => {

                if ( err ) {
                    return console.error( err );
                }

                temporary_storage.directory_links.push( row );

            });

        }

        Output__To__The__Console( "\x1b[32m", 'Созданы таблицы для каталогов' );

    });

    connection.end();

}

async function ScanReviews ( card_address ) {

    let storage = [];

    const browser = await puppeteer.launch( );
    const page = await browser.newPage( );
    await page.setDefaultNavigationTimeout( 0 );
    await page.goto( card_address );

    const Reviews = async ( ) => {
        const reviews = await page.evaluate(( ) => {

            // const number_of_reviews = document.querySelector(`.mod-reviews`).childNodes.length;
            // const number_of_images = document.querySelector(`.review-image__list`).childNodes.length

            // let pseudo_storage = [];

            // for ( let i = 1; i <= number_of_reviews; i++ ) {

            //     let text = document.querySelector( `.item:nth-child( ${ i } ) .item-content .content` ).textContent;

            //     let image_addresses = [];

            //     for ( let r = 1; r <= number_of_images; r++ ) {

            //         // let image = document.querySelector(`.review-image__item:nth-child( ${ r } )`).outerHTML;
            //         let image = document.getElementById(`block-3VtVgZo7a75`).querySelector( '.mod-reviews' ).outerHTML;
            //         // let style = image.currentStyle || window.getComputedStyle( image, false );
            //         // let bi = style.backgroundImage.slice(4, -1).replace(/"/g, "");

            //         image_addresses.push( image );

            //     }

            //     pseudo_storage.push( image_addresses );

            // }

            return document.getElementById(`block-3VtVgZo7a75`).outerHTML;

        }).catch( e  => console.dir(e));

        // storage.push( reviews );

        fs.writeFileSync( 'page.html', reviews )

        console.log( "ok" );
    };

    Reviews( );

}

async function Getting__Secondary__Links ( browser, object ) {

    const page = await browser.newPage( );
    await page.setDefaultNavigationTimeout( 0 );
    await page.goto( object.url );

    const page_processing = await page.evaluate(( ) => {
        return Number( document.querySelectorAll(`.ant-pagination-item`)[ document.querySelectorAll(`.ant-pagination-item`).length - 1 ].title );
    }).then(( number ) => {

        let crawl_links = [];

        for ( let count = 1; count <= 2; count++ ) {

            crawl_links.push( `${ object.url }&page=${ count }` );

        }

        object.crawl_links = [];

        object.crawl_links.push( crawl_links );

        Output__To__The__Console( "\x1b[32m", `Сформированы ссылки для каталога - ${ object.name }` );

    }).catch(( e ) => {
        console.log( e );
    });

    return { browser : browser, object : object };

}

async function Finding__Product__Links( modified_object ) {

    for ( let array of modified_object.object.crawl_links ) {

        for ( let count = 0; count < 1; count++ ) {

            const page = await modified_object.browser.newPage( );
            await page.setDefaultNavigationTimeout( 0 );
            await page.goto( array[ count ] );

            const product_links = await page.evaluate(( ) => {

                let _95X4G = document.querySelectorAll( '._95X4G a' );

                let link_storage = [];

                for ( let link of _95X4G ) {

                    link_storage.push( link.href );

                }

                return link_storage;

            }).then(( res ) => {

                modified_object.object.product_links = [];

                modified_object.object.product_links.push( res );

            }).catch(( e ) => {
                console.log( e );
            });

        }

    }

    Output__To__The__Console( "\x1b[32m", `Отсканированы ссылки на товары для каталога ${ modified_object.object.name }` );

    return modified_object;

}

async function Crawling__Product__Pages( re_modified_object ) {

    const page = await re_modified_object.browser.newPage( );
    await page.setDefaultNavigationTimeout( 0 );

    for ( let link_index = 0; link_index <= 2; link_index++ ) {

        const product_directory = path.join( re_modified_object.object.directory_location , re_modified_object.object.product_links[0][ link_index ].match(/https:\/\/www\.lazada\.co\.th\/products\/(.+?)\.html/)[1] );

        if ( !fs.existsSync( product_directory ) ) {

            fs.mkdirSync(( product_directory ), ( err ) => {
                if ( err ) {
                    return console.error( err );
                }
            });

        }

        await page.goto( re_modified_object.object.product_links[0][ link_index ] );

        let storage = {
            link_to_the_page: '',
            links_to_photos: [],
            description: '',
            price: '',
            specifications: []
        };

        storage.link_to_the_page = re_modified_object.object.product_links[0][ link_index ];

        const slider_preview_blocks = await page.evaluate(( ) => {
            const array_of_blocks = Array.from( document.querySelectorAll('.next-slick-slide') );
            return array_of_blocks.map( block => block.textContent );
        });

        let current_slider_image = await page.evaluate(( ) => {

            if ( document.querySelector('.gallery-preview-panel__content img') !== null ) {

                return document.querySelector('.gallery-preview-panel__content img').src;

            } else {

                return null;

            }

        }).then(( src ) => {
            storage.links_to_photos.push( src );
        }).catch(( e ) =>{
            console.log( e );
        });

        for ( let count = 2; count <= slider_preview_blocks.length; count++ ) {

            await page.hover(`.item-gallery__thumbnail:nth-child(${ count })`);
        
            current_slider_image = await page.evaluate(( ) => {
                return document.querySelector('.gallery-preview-panel img').src;
            }).then(( src ) => {
                storage.links_to_photos.push( src );
            }).catch(( e ) =>{
                console.log( e );
            });
    
        }

        for ( let image_path of storage.links_to_photos ) {

            if ( image_path !== null ) {

                download.image( { url: image_path, dest: product_directory } )
                .catch((err) => console.error(err));

                let res = image_path.split('/').pop().split('');
                let lastIndex = res.lastIndexOf( '.' );
                let reassembled_array = res.slice(0, lastIndex).join('');

                let imageIndex = storage.links_to_photos.indexOf( image_path );

                storage.links_to_photos[ imageIndex ] =  reassembled_array;

            }

        }

        const description = await page.evaluate(( ) => {
            return document.querySelector('.pdp-mod-product-badge-title').textContent;
        }).then(( src ) => {
            storage.description = src;
        }).catch(( e ) =>{
            console.log( e );
        });

        const price = await page.evaluate(( ) => {
            const pdpPrice = document.querySelector('.pdp-price').textContent;
            return pdpPrice.substr(1);
        }).then(( price ) => {
            storage.price = price;
        }).catch(( e ) =>{
            console.log( e );
        });

        const technical_specifications = await page.evaluate(( ) => {

            if ( document.querySelector('.pdp-product-highlights ul') !== null ) {

                let processed_characteristics = [];
    
                let number_of_characteristics = document.querySelector('.pdp-product-highlights ul').childNodes.length;
        
                for ( let count = 1; count <= number_of_characteristics; count++ ) {
        
                    let description_text = document.querySelector(`.pdp-product-highlights ul li:nth-child( ${ count } )`).textContent;
        
                    let corrected_text = description_text.substr( 3 );
        
                    processed_characteristics.push( corrected_text );
        
                }
        
                return processed_characteristics;

            } else if ( document.querySelectorAll('.pdp-product-desc h1')[0] !== null ) {

                let processed_characteristics = [];
    
                let number_of_characteristics = document.querySelectorAll('.pdp-product-desc .detail-content').length;
        
                for ( let count = 1; count <= number_of_characteristics; count++ ) {

                    let description_text = document.querySelectorAll(`.pdp-product-desc h1:nth-child( ${ count } )`)[0].textContent;
        
                    processed_characteristics.push( description_text );
        
                }
        
                return processed_characteristics;

            } else if ( document.querySelectorAll('.pdp-product-desc p')[0] !== null ) {

                let processed_characteristics = [];
    
                let number_of_characteristics = document.querySelectorAll('.pdp-product-desc p').length;
        
                for ( let count = 1; count <= number_of_characteristics; count++ ) {

                    let description_text = document.querySelectorAll(`.pdp-product-desc p:nth-child( ${ count } )`)[0].textContent;
        
                    processed_characteristics.push( description_text );
        
                }
        
                return processed_characteristics;

            } else {

                return undefined;

            }
    
        }).then(( array_of_characteristics ) => {
            storage.specifications.push( array_of_characteristics );
        }).catch(( e ) =>{
            console.log( e );
        });

        connection.connect();

        const links_to_photos = storage.links_to_photos.join( );
        const specifications = storage.specifications.join( );

        connection.query( `SET client_encoding TO 'UTF8'; INSERT INTO "${ re_modified_object.object.name }" (
            images,
            description,
            price,
            specifications
            ) VALUES ( 
            '${ links_to_photos }',
            '${ storage.description }',
            '${ storage.price }',
            '${ specifications }'
        );`, ( err, result ) => {

            if ( err ) {
                console.log( err );
            }

        });

        connection.end();

        // pool.connect(( err, client, release ) => {

        //     if ( err ) {
        //         console.log( err );
        //     }

        //     Output__To__The__Console( "\x1b[32m", `Вывод всех товаров из каталога ${ name }` );

        //     client.query( `SELECT * FROM ${ name.toLowerCase() }`, ( err, result ) => {
        //         release( );

        //         if ( err ) {
        //             console.log( err );
        //         }

        //         console.log( result.rows );

        //     });

        // });


    }

    Output__To__The__Console( "\x1b[32m", `Просканированы товары для каталога - ${ re_modified_object.object.name }` );

    return true;

}

async function FullScan( ) {

    const browser = await puppeteer.launch( );
    Output__To__The__Console( "\x1b[32m", 'Браузер создан' );

    Preliminary__Actions(  );

    setTimeout(( ) => {

        for ( let object of temporary_storage.directory_links ) {

            Getting__Secondary__Links( browser, object ).then(( modified_object ) => {

                Finding__Product__Links( modified_object ).then(( re_modified_object ) => {

                    Crawling__Product__Pages( re_modified_object ).then(async( status ) => {

                        if ( status ) {
        
                            await browser.close().then(() => {
                                console.log( 'Браузер уничтожен' );
                            })
                            .catch(( e ) => {
                                console.log( e );
                            });

                        }

                    });

                });

            });

        }

    }, 2000);

}

function Weekly__Check ( ) {

    (async( ) => {

        const browser = await puppeteer.launch( );
        Output__To__The__Console( "\x1b[32m", 'Браузер создан' );
        Output__To__The__Console( "\x1b[32m", 'Начата еженедельная проверка' );

        for ( let object of temporary_storage.directory_links ) {

            Getting__Secondary__Links( browser, object ).then(( updated_object ) => {

                Finding__Product__Links( updated_object ).then(async( status ) => {

                    if ( status ) {
    
                        await browser.close().then(() => {
                            Output__To__The__Console( "\x1b[32m", 'Браузер уничтожен' );
                            Output__To__The__Console( "\x1b[32m", 'Еженедельная проверка завершилась успешно' );
                        })
                        .catch(( e ) => {
                            console.log( e );
                        });

                    }

                });

            });
    
        }

    })();

}

function Checking__Directories( ) {

    Output__To__The__Console( "\x1b[32m", 'Плановая проверка каталогов' );

    let new_current_state_of_directories;

    connection.connect( );

    connection.query( 'SELECT * FROM catalogs;', ( err, result ) => {

        if ( err ) {
            return console.error( err );
        }

        new_current_state_of_directories = result.rows;

    });

    connection.end( );

    if ( new_current_state_of_directories !== temporary_storage.directory_links ) {

        let temporary_storage;

        for ( let object of new_current_state_of_directories ) {

            if ( temporary_storage.directory_links.indexOf( object ) ) {

                temporary_storage.directory_links.push( object );

                Output__To__The__Console( "\x1b[32m", 'Зафиксировано изменение каталогов' );

                (async( ) => {

                    const browser = await puppeteer.launch( );
                    Output__To__The__Console( "\x1b[32m", 'Браузер создан' );

                    Getting__Secondary__Links( browser, object ).then(( modified_object ) => {

                        Finding__Product__Links( modified_object ).then(( re_modified_object ) => {
        
                            Crawling__Product__Pages( re_modified_object ).then(async( status ) => {
        
                                if ( status ) {
        
                
                                    await browser.close().then(() => {
                                        Output__To__The__Console( "\x1b[32m", 'Браузер уничтожен' );
                                        Output__To__The__Console( "\x1b[32m", 'Еженедельная проверка завершилась успешно' );
                                    })
                                    .catch(( e ) => {
                                        console.log( e );
                                    });
        
                                }
        
                            });
        
                        });

                    });

                })();

            }

        }

    }
    
}

module.exports = { FullScan, Weekly__Check, Checking__Directories };