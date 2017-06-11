"use strict";

function main() {
    var btn_open = document.querySelector("#open");

    btn_open.addEventListener("click", function () {
        var i_Image =  document.querySelector("#image"),
            f_image = i_Image.files[0];

        if( !f_image.name || !f_image.type ) {
            alert("请选择一个文件");
            return;
        }
        if( f_image.type != "image/jpeg" && f_image.type != "image/png" ) {
            alert("请选择jpg/jpeg/png类型的图片");
            return;
        }

        var fr_image = new FileReader();

        fr_image.readAsDataURL(f_image);

        fr_image.onload = function (ev) {
            var i_MainImage = document.querySelector("#mainimage"), 
                i_tImage = new Image();

            i_tImage.src = ev.target.result;
            i_MainImage.src = ev.target.result;

            i_tImage.addEventListener("load", function () {
                console.log("width: " + i_tImage.width + " height:" + i_tImage.height);

                //将图片画入Canvas获取ImageData
                var c_tCanvas = document.createElement("canvas"),
                    ctx       = c_tCanvas.getContext("2d"),
                    id_image;

                c_tCanvas.width = i_tImage.width;
                c_tCanvas.height = i_tImage.height;
                
                ctx.drawImage(i_tImage, 0, 0);

                id_image = ctx.getImageData(0, 0, i_tImage.width, i_tImage.height);

                console.log("ImageData width: " + id_image.width + " height:" + id_image.height);

                i_MainImage.src = c_tCanvas.toDataURL();

                doKMeans(id_image, i_tImage.width, i_tImage.height, 8, 20);

            }, false);
        };
        
    }, false);
}

/*
* 获取ImageData坐标x, y处的颜色值
* @param {ImageData} imageData
* @param {Number} x
* @param {Number} y
* @return color  
*/
function getPixelFromImageData(imageData, x, y) {
    if( x < 0 || y < 0 || x > imageData.width || y > imageData.height ) {
        return {
            r : 0 ,
            g : 0 ,
            b : 0 ,
            a : 255
        };
    }
    else {
        var r = imageData.data[ y * ( imageData.width * 4 ) + x * 4 ] ,
            g = imageData.data[ y * ( imageData.width * 4 ) + x * 4 + 1 ] ,
            b = imageData.data[ y * ( imageData.width * 4 ) + x * 4 + 2 ] ,
            a = imageData.data[ y * ( imageData.width * 4 ) + x * 4 + 3 ] ;
            
        return {
            r : r ,
            g : g ,
            b : b ,
            a : a
        };
    }
}

/*
* 在颜色数组中查找最接近的颜色
* @param colorItem 从ImageData中获取点的色彩信息
* @param colorArray 颜色数组
* @return index 最接近的颜色在数组中的索引  
*/
function findCloseColor(colorItem, colorArray) {
    var minAddColor = Infinity ,
        index       = -1 ,
        color       = colorItem.color;
    colorArray.forEach(function (item, idx) {
        var s = 0;

        s += Math.abs(color.r - item.r);
        s += Math.abs(color.g - item.g);
        s += Math.abs(color.b - item.b);

        if( s < minAddColor ) {
            minAddColor = s;
            index = idx;
        }
    });

    return index;
}

/*
* 克隆一个对象
* @param obj 要克隆的对象
* @return 返回新对象
*/
function clone(obj) {
    if( typeof obj !== "object" || obj === null || obj === undefined ) return obj;

    if( obj instanceof Array ) {
        var arr = new Array();
        obj.forEach(function (item) {
            arr.push( clone(item) );
        });

        return arr;
    }

    var dest = new Object();
    Object.keys(obj).forEach(function(key) {
        dest[key] = clone( obj[key] );
    });
    return dest;
}

/*
* 比较两色差异
* @param color1 
* @param color2 
* @return 两色差异值
*/
function colorDiff(color1, color2) {
    var s = 0;

    s += Math.abs( color1.r - color2.r );
    s += Math.abs( color1.g - color2.g );
    s += Math.abs( color1.b - color2.b );

    return s;
}

function doKMeans(imageData, width, height, K, maxTimes) {
    console.log(imageData.data.length);
    
    // var maxTimes = 10;
    var i, j ,
        a_color = new Array(),
        a_markColor = new Array();
        
    for(i = 0; i < height; i++) {
        for(j = 0; j < width; j++) {
            var c_t = getPixelFromImageData(imageData, j, i);
            a_color.push({
                color : c_t ,
                label : -1
            });
        }
    }
    console.log("Initialized");
    console.log(a_color.length);

    for(i = 1; i <= K; i++) {
        //从图片中随机选择标志颜色
        // var rr = Math.random();
        // var ri = parseInt(rr * a_color.length);
        // a_markColor.push( a_color[ri].color );

        //随机生成标志颜色
        a_markColor.push( {
            r : parseInt( Math.random() * 255 ) ,
            g : parseInt( Math.random() * 255 ) ,
            b : parseInt( Math.random() * 255 )
        } );
    }

    console.log(a_markColor);
    console.log(findCloseColor(a_color[0], a_markColor));

    var final = null ,
        finalColorString = "" ,
        lastMarkedColor = clone( a_markColor );
    while(maxTimes--) {
        var s = new Array() ,
            maxCount = 0;
        for(i = 0; i < K; i++) {
            s[i] = {
                r : 0 ,
                g : 0 ,
                b : 0 ,
                count : 0
            };
        }

        for(i = 0; i < a_color.length; i++) {
            var colorIndex = findCloseColor(a_color[i], a_markColor);

            s[colorIndex].r += a_color[i].color.r;
            s[colorIndex].g += a_color[i].color.g;
            s[colorIndex].b += a_color[i].color.b;

            s[colorIndex].count ++;
        } 

        for(i = 0; i < K; i++) {
            if( s[i].count > 0 ) {
                a_markColor[i].r = parseInt(s[i].r / s[i].count);
                a_markColor[i].g = parseInt(s[i].g / s[i].count);
                a_markColor[i].b = parseInt(s[i].b / s[i].count);
            }
            if( s[i].count > maxCount ) {
                maxCount = s[i].count;
                final = a_markColor[i];
            }
        }

        console.log("#" + maxTimes, s, a_markColor);

        var sumDiff = 0;
        for(i=0; i<K; i++) {
            sumDiff += colorDiff( lastMarkedColor[i], a_markColor[i] );
        }

        if( sumDiff <= ( 2 * K ) ) break;

        lastMarkedColor = clone( a_markColor );

    }

    console.log(final);

    finalColorString += final.r.toString(16);
    finalColorString += final.g.toString(16);
    finalColorString += final.b.toString(16);

    console.log(finalColorString);

    document.querySelector("#changebg").style.backgroundColor = "#" + finalColorString;
    document.querySelector("#maincolor").value = "主体色彩 : #" + finalColorString;
}

document.addEventListener("DOMContentLoaded", main, false);