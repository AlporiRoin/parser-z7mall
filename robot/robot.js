const request = require('request'),
      puppeteer = require('puppeteer'),
      fs = require('fs'),
      path = require('path'),
      axios = require('axios');

let temporary_storage = {
    directory_links: [
        'https://www.lazada.co.th/shop-mobiles/?spm=a2o4m.home.cate_1_1.1.52c72a80abMkBz',
        'https://www.lazada.co.th/shop-tablet/?spm=a2o4m.home.cate_1_2.1.52c72a80HIYYKs',
    ],
    crawl_links: [],
    product_links: []
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

async function FullScan( ) {

    const browser = await puppeteer.launch( );
    console.log( 'Браузер создан' );

    async function Checking__For__A__Bot ( ) {

        const page = await browser.newPage( );
        await page.setDefaultNavigationTimeout( 0 );
        await page.goto( temporary_storage.directory_links[0] ).then(async( ) => {
            console.log( 'Загружена страница:' + temporary_storage.directory_links[0] );

            const query = await page.evaluate(( ) => {
                return document.querySelector( '.JrAyI' ).textContent;
            }).then(( html ) => {
                console.log( html );
            }).catch(( e ) => {
                console.log( e );
            });
        });
        await page.goto( temporary_storage.directory_links[1] ).then(async( ) => {
            console.log( 'Загружена страница:' + temporary_storage.directory_links[1] );

            const query = await page.evaluate(( ) => {
                return document.querySelector( '.JrAyI' ).textContent;
            }).then(( html ) => {
                console.log( html );
            }).catch(( e ) => {
                console.log( e );
            });
        });

    }

    async function Getting__Secondary__Links ( ) {

        for ( let link of temporary_storage.directory_links ) {

            console.log( link );

            const page = await browser.newPage( );
            await page.setDefaultNavigationTimeout( 0 );
            await page.goto( link );

            const page_processing = await page.evaluate(( ) => {
                return Number( document.querySelectorAll(`.ant-pagination-item`)[ document.querySelectorAll(`.ant-pagination-item`).length - 1 ].title );
            }).then(( number ) => {

                let crawl_links = [];

                for ( let count = 1; count <= number; count++ ) {

                    crawl_links.push( `${ link }&page=${ count }` );

                }

                temporary_storage.crawl_links.push( crawl_links );

                return;

            }).catch(( e ) => {
                console.log( e );
            });

        }

    }

    async function Creating__A__Product__Directory ( ) {



    }

    async function Finding__Product__Links( ) {

        for ( let array of temporary_storage.crawl_links ) {

            console.log( array );

            for ( let count = 0; count <= 1; ) {

                const page = await browser.newPage( );
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
    
                    temporary_storage.product_links.push( res );

                    Crawling__Product__Pages( res ).then(( res ) => {
                        if ( res ) {
    
                            count++;
    
                        }
                    }).catch(( e ) => {
                        console.log( e );
                    });
    
                }).catch(( e ) => {
                    console.log( e );
                });

            }

        }

        console.log( temporary_storage.product_links );

    }

    async function Crawling__Product__Pages( array ) {

        const page = await browser.newPage( );
        await page.setDefaultNavigationTimeout( 0 );

        for ( let elem = 0; elem <= 3; elem++ ) {

            console.log( array[ elem ] );

            const product_directory = path.join( __dirname, '../static/' , array[ elem ].match(/https:\/\/www\.lazada\.co\.th\/products\/(.+?)\.html/)[1] );

            fs.mkdirSync(( product_directory ), ( err ) => {
                if ( err ) {
                    return console.error( err );
                }
            });

            await page.goto( array[ elem ] );

            let storage = {
                link_to_the_page: '',
                links_to_photos: [],
                description: '',
                price: '',
                specifications: []
            };

            storage.link_to_the_page = array[ elem ];

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

            let uploading_an_image = function ( url, filename, callback ) {

                request.head( url, function( err, res, body ) {
                    console.log('content-type:', res.headers['content-type']);
                    console.log('content-length:', res.headers['content-length']);
                
                    request( url ).pipe( fs.createWriteStream( filename ) ).on( 'close', callback );
                });

            };

            // const uploading_an_image = (url, image_path) =>
            //     axios({
            //         url,
            //         responseType: 'stream',
            //     }).then(
            //         response =>
            //             new Promise((resolve, reject) => {
            //             response.data
            //                 .pipe(fs.createWriteStream(image_path))
            //                 .on('finish', () => resolve())
            //                 .on('error', e => reject(e));
            //             }),
            // );

            for ( let image_path of storage.links_to_photos ) {

                uploading_an_image( image_path, product_directory, function( ) {
                    console.log( 'Изображение загружено!' );
                });

                // console.log( typeof image_path );

                // (async () => {
                //     await uploading_an_image( image_path , product_directory );
                // })();

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

            console.log( storage );

        }

        return true;

    }

    function Beginning( ) {

        // Checking__For__A__Bot( ).then(( ) => {

        //     (async( ) => {
    
        //         await browser.close().then(( ) => {
        //             console.log( 'Браузер уничтожен' );
        //         }).catch(( e ) => {
        //             console.log( e );
        //         });

        //     })();

        // });

        Getting__Secondary__Links( ).then(( ) => {

            console.log( 'Вторичные ссылки получены' );

            Finding__Product__Links( ).then(( ) => {

                console.log( temporary_storage.product_links );

                (async( ) => {

                    await browser.close().then(( ) => {
                        console.log( 'Браузер уничтожен' );
                    }).catch(( e ) => {
                        console.log( e );
                    });
    
                })();

            });

        });

        return;

    }

    Beginning( );

}

module.exports = { FullScan };