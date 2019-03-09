---
title: Weex Android Border绘制
categories: Android
---

# Weex Android Border绘制
本问首发于[云栖社区](https://yq.aliyun.com/articles/60784)，介绍了如何在Android上实现**CSS border**属性。

## 背景
在Weex中，`border`实际上代表了四个属性，即`border-width`, `border-color`, `border-style`, `border-radius`，实际上Weex并不支持`border`这个shorthand。这四个属性的默认值和所支持的值与W3C略有不同：

* `border-width`：默认值为0，支持设置为大于零的长度（单位是像素）。`border-width`是`border-top-width`, `border-right-width`, `border-bottom-width`，`border-left-width`这四个属性的缩写。
* `border-color`: 默认值为black，支持值为某个颜色值。`border-color`是`border-top-color`, `border-right-color`, `border-bottom-color`, `border-left-color`这四个属性的缩写。
* `border-style`: 默认值为`solid`，支持值为`solid`，`dotted`，`dashed`。`border-style`是`border-top-style`, `border-right-style`, `border-bottom-style`, `border-left-style`的缩写。
    * `border-style`不支持`none`，这与W3C标准不同，但却避免了`border-style:none`时，需要将`border-width`置为0的问题。
    * `border-style:dotted`会绘制长宽和`border-width`相等的正方形，而不是W3C中规定的圆。
* `border-radius`： 默认值为0，支持设置为大于0的长度（单位是像素）。此属性指示user-agent在某个角落（左上，右上，右下，左下），使用指定的半径画一段圆心角为90度的椭圆弧。`border-radius`是`border-top-left-radius`, `border-top-right-radius`, `border-bottom-right-radius`, `border-bottom-left-radius`这四个属性的缩写。

在根据以上属性绘制border时，需要考虑以下几个case的处理方法。

### Corner Shaping
在W3C中，当`border-radius`大于0时，会使用一段椭圆弧来链接邻接的两条边。这段弧的宽度是由`border-width`决定的，且邻接两边的`border-width`可能不一致，因此inner-corner和outer-corner可能只能绘制出一条来。

#### 当border-x-y-radius <= border-x-width或border-x-y-radius <= border-y-width时
代码片段：

    <img src="http://www.fresher.ru/manager_content/images2/kadry-veka/big/2-1.jpg" 
              style="width:200px; height:300px; background-color:#0000ff;margin:50px;
              box-sizing:border-box;
              padding: 20px;
              border-color:#000000;
              border-style:solid;
              border-top-width: 30px;
              border-left-width: 50px;
              border-top-left-radius: 20px"/>
渲染结果如下所示:

![当`border-x-y-radius` <= `border-x-width`或`border-x-y-radius` <= `border-y-radius`时](http://img3.tbcdn.cn/L1/461/1/89607919b9d248cd7bae5cfb84e4e620b7fb0476)

上述代码对左上角设置了`border-radius`，且`border-radius`小于邻接两边中某一边的`border-width`，此时只绘制outer-corner，不绘制inner-corner，即outer-corner表现为圆角，inner-corner表现为直角，且左上角圆弧对应的椭圆圆心在黑色的border区域内。

#### 当border-x-y-radius > border-x-width 且 border-x-y-radius > border-y-width时
代码片段：

    <img src="http://www.fresher.ru/manager_content/images2/kadry-veka/big/2-1.jpg" 
              style="width:200px; height:300px; background-color:#0000ff;margin:50px;
              box-sizing:border-box;
              padding: 20px;
              border-color:#000000;
              border-style:solid;
              border-top-width: 30px;
              border-left-width: 50px;
              border-top-left-radius: 80px"/>
渲染结果如下所示：

![ 当`border-x-y-radius`> `border-x-width`且`border-x-y-radius`>`border-y-radius`时](http://img1.tbcdn.cn/L1/461/1/1368f2cef64f5f127423c71bbbff0a05ebed6be9)
              
上述代码对左上角设置了`border-radius`，且`border-radius`大于邻接两边任意一边的`border-width`，此时同时绘制outer-corner和inner-corner，即inner-corner和outer-corner均表现为圆角，且左上角圆弧对应的椭圆圆心在黑色border区域外。

### Corner Clipping
Weex暂不支持设置`background-clip`属性，因此应用默认值，即`background-clip:border-box`。如果设置了`border-radius`，就要求`border-box`裁剪到指定的圆角矩形（可能退化成椭圆）区域，否则裁剪到一个矩形区域。同时[CSS Backgrounds and Borders Module Level 3](https://www.w3.org/TR/css3-background/)要求`background-color`需要延伸到`border`区域下面。因此对应于下面的代码片段

    <img src="http://www.fresher.ru/manager_content/images2/kadry-veka/big/2-1.jpg" 
              style="width:300px; height:300px; background-color:#0000ff;margin:50px;
              box-sizing:border-box;
              padding: 20px;
              border-color:#000000;
              border-style:dashed;
              border-width: 30px;
              border-radius: 150px"/>
需要得到如下渲染效果:

![Corner Clipping](http://img4.tbcdn.cn/L1/461/1/bdd8d0ad1cc4e65d1aae29b2215bef45c9fd53b9)
              
其中，`border-style`是dotted，所以可以在黑色的border下面的蓝色的背景。由于设置了padding，因此在使用蓝色背景填充padding区域，表现为蓝色圆环。border，padding，content区域均按照`background-clip:border-box`进行clip。

### Overlapping-Curvers
由于在`border-radius`没有最大值，因此两个相邻的`border-radius`的和可能大于css box model的width，导致两条弧有重合的部分。在遇到这种情况时，userAgent必须根据下面的[算法](https://www.w3.org/TR/css3-background/#corner-overlap)对`border-radius`进行缩放：
>
Let f = min(Li/Si), where i ∈ {top, right, bottom, left}, Si is the sum of the two corresponding radii of the corners on side i, and Ltop = Lbottom = the width of the box, and Lleft = Lright = the height of the box. If f < 1, then all corner radii are reduced by multiplying them by f.

即对于如下的代码片段：

    <img src="http://www.fresher.ru/manager_content/images2/kadry-veka/big/2-1.jpg" 
              style="width:200px; height:300px; background-color:#0000ff;margin:50px;
              box-sizing:border-box;
              padding: 20px;
              border-color:#000000;
              border-style:solid;
              border-top-width: 30px;
              border-left-width: 50px;
              border-right-width: 30px;
              border-top-left-radius: 180px;
              border-top-right-radius: 220px"/>
需要如下的渲染效果：

![Overlapping-Curvers](http://img4.tbcdn.cn/L1/461/1/143d269c1df16e089f77ced5e85efeb09c84061e)
              
其中左上角和右上角的`border-radius`相加已经超过`width`，此时按照上述算法，对所有的`border-radius`按照系数0.5进行缩放，并使用缩小后的`border-radius`进行渲染。

## 现状
目前Android SDK(截至至Android 7.0, API 24, Nougat) 不支持border，想要绘制border，需要开发者使用一些hack方案。由于Android支持为View设置一个背景图层（Drawable），常见的android border绘制方案均是使用背景图层绘制border，下面列举主流的border绘制方案及其优劣。
### 9-Patch
[9-Patch](https://developer.android.com/studio/write/draw9patch.html)是一种Android下的一种图片格式，可以为这种图片定义可缩放区和不可缩放区，以避免图片缩放带来的模糊问题。通过9-Patch，把border的直线区域定义成可缩放区域，圆角区域定位为不可缩放区域，来绘制border，同时解决图片缩放带来的模糊问题。
#### 优点
* 简单，使用可视化工具处理图片，无需代码。

![9-patch](https://developer.android.com/images/draw9patch-norm.png)

#### 缺点
* 扩展性极差，例如需要为每一个不同的`border-color`或`border-style`提供一张图片。

因此9-Patch方案适用于简单的border样式，且样式在编译时就已经确定了情况。

### &lt;shape&gt;
&lt;shape&gt;描述一个基本图形，例如矩形、圆形、圆角矩形等。&lt;shape&gt;可以使用XML或Java代码定义，二者基本等价。鉴于使用XML可读性较高，下面使用XML定义一个&lt;shape&gt;。

	<?xml version="1.0" encoding="utf-8"?>
	<shape xmlns:android="http://schemas.android.com/apk/res/android" >
	    <!-- border-radius -->
	    <corners android:radius="20px" />
	
		<!-- background-color -->
	    <solid android:color="#0000FF" />

	    <!-- border-width & border-color -->
	    <stroke
	        android:width="30px"
	        android:color="#000000" />
	</shape>
	
可得到如下的渲染效果

![shapeDrawable](http://img3.tbcdn.cn/L1/461/1/9f7fb902db3524b857b2af19e0a3c7de80eb78c7)

#### 优点
* 使用XML编写，逻辑简单，可读性强
* 具有一定的扩展性，可以通过Java代码操作ShapeDrawable的属性。

#### 缺点
&lt;shape&gt;不支持`border-x-style`, `border-x-color`, `border-x-width`。常用的hack办法是通过&lt;layer-list&gt;，在的上面&lt;shape&gt;遮盖一层，以实现单边的效果。下图通过遮盖的方法，隐藏了bottom这条边，保持left,top,right三条边的显示：

![layer-list](http://blog.xianqu.org/images/2012-04-android-layer-list-2.jpg)

这样做有如下几个缺陷：

* view中几乎每一个像素都绘制了两次，带来了OverDraw问题，会导致一定的性能损失。
* &lt;layer-list&gt;只能解决某条边显示或不显示的问题，无法解决`border-left-style:dotted`,`border-top-style:dashed`这样两边style或color不一致的问题。

适用于复杂度中等的case，且border的各边颜色和style一致的情况。
### Canvas
自定义一个`Drawable`对象，根据`border-style`, `border-radius`, `border-width`, `border-color`，使用Canvas绘制每一条边。

#### 优点
* 扩展性强，可以解决上述几个方案中无法支持的case。

#### 缺点
* 逻辑复杂，每一条边，每一个角都需要单独处理。

适用于复杂度高，且对性能有要求的情景。

## 解决方案
Weex Android采用自定义`Drawable`对象，并通过Canvas来绘制border。

Weex Android在绘制border的时候，依照border的四条边，分别绘制各边。对于每一条边，需要绘制三次，分别是previous-corner，line, post-corner。具体流程如下图所示：
![border-draw-procedure](http://img3.tbcdn.cn/L1/461/1/74ea76ecdc19b7c7e6f6c70287fc6e701480fe49)。

### 概念阐述
下面先解释Weex Android绘制border过程中用到的一些名词。

#### Path
在Android中，Path描述一个闭合的contour或者一条开放的线。例如，可以用Path描述一个椭圆，一条直线，一条Bézier曲线等几何图形。Weex使用Path描述圆角矩形的corner.

#### PaintStyle
在Android中Paint.Style描述绘制模式。常见的绘制模式有两种，Stroke及Fill。

##### Fill
Fill 使用指定的颜色填充指定区域，如使用蓝色填充矩形区域。

![Fill](http://img3.tbcdn.cn/L1/461/1/568363d008b6f772f5013e1bdefed4f5bdae007b)

##### Stroke
Stroke 使用指定的颜色和宽度，对指定的区域进行描边。例如使用蓝色画笔，画笔宽度为5像素，对矩形进行描边。

![Stroke](http://img1.tbcdn.cn/L1/461/1/a9cf2372e15633bfce4ee5f7b9f2e20ddbb80663)

### 处理border-radius
在绘制border前，需要依照**Overlapping-Curvers**中所述的算法，对`border-radius`进行缩放。之后的绘制，使用缩放后的`border-radius`。

### 绘制background-color
在绘制`background-color`的时候，根据`border-radius`, `border-width`, `width`, `height`构造了一个圆角矩形Path，并使用`background-color`填充这个Path。

### 绘制border
下面以绘制Top Line为例，阐述绘制一边的方法。绘制其他边的过程与此类似，不再重复论述。

只有当`border-width`大于0的时候，某条边才会被绘制。而根据`border-x-width`, `border-y-width`, `border-x-x-radius`的大小关系，绘制某条边的时候可能出现下面三种case。

下面图中W1,W2是邻接两边的`border-width`，R是`border-x-y-radius`，实线为`Paint`笔触所走路线，虚线表示辅助线。黄色区域为`border-width`所影响的填充区域，蓝色区域为邻接两边的过渡区域(若有)。

#### border-x-y-radius = 0
此时不存在border-corner，top-line与left-line使用直线连接，转折处呈现直角，如下图所示。

![border-x-y-radius = 0](http://img4.tbcdn.cn/L1/461/1/39f9d7bd5ce8bc4e1c70a826f901e633599a8d10)

#### border-x-y-radius > 0
此时存在border-corner，top-line与left-line使用椭圆弧连接，椭圆的圆心取决与border-width与border-radius的大小关系。连接top-line与left-line的椭圆弧的圆心角为90℃，top-line负责绘制其中的45℃，left-line负责绘制剩余的45度，下面将阐述top-line负责绘制的45℃椭圆弧，left-line绘制剩余45℃椭圆弧的过程与此类似。

##### border-x-y-radius <= border-x-width || border-x-y-radius <= border-y-radius
左上角border-corner所对应的椭圆弧的圆心在border的填充区域内，椭圆的长轴和短轴长度相等，椭圆退化成圆，圆的半径是border-x-y-radius/2，绘制圆弧所使用的笔触的宽度也是border-x-y-radius/2

![border-x-y-radius <= border-x-width || border-x-y-radius <= border-y-radius](http://img4.tbcdn.cn/L1/461/1/c18133044c611ae9a9bd4632214311a2bdfdbd49)

##### border-x-y-radius > border-x-width && border-x-y-radius > border-y-radius
左上角border-corner所对应的椭圆弧的圆心在border填充区域外，椭圆的一个半轴长为R-W1/2,另一个半轴的长为R-W2/2，绘制圆弧所使用的笔触的宽度为W2.

![border-x-y-radius > border-x-width && border-x-y-radius > border-y-radius](http://img3.tbcdn.cn/L1/461/1/b867eebd0c8ff45ead570398228f53329b701f93)

## To be excellent...
按照上述绘制流程，可以完成依照`border-width`, `border-color`, `border-style`, `border-radius`属性来绘制border的渲染任务。然而为了更好的渲染效果，还需要考虑以下问题：

### 处理background-clip:border-box属性
[background-clip](https://developer.mozilla.org/en-US/docs/Web/CSS/background-clip)属性描述了background区域和border区域之间的关系。在weex中，默认指定了`background-clip: border-box`，且该属性不可修改。故有如下关系：

* background-color区域的z-index（假设能为其设置z-index）最小，渲染区域包括border区，content区。
* content区域的z-index大于background-color区域，border区域的z-index大于content区域，border与content渲染区域没有重合，二者之间的距离是padding。
* 如果存在border-radius，background-color区域和content区域可能表现为圆角矩形或椭圆。
* 如果存在半透明效果，透过content或者border，可以看见background-color区域。

下面所示是带有border-radius,padding，background-color属性的view的绘制结果

![background_clip_raw](http://ata2-img.cn-hangzhou.img-pub.aliyun-inc.com/e51b74182b231269308fd7363fb79060)

旋60℃后，可以看到background-color, content, border的层次关系。

![background_clip](http://ata2-img.cn-hangzhou.img-pub.aliyun-inc.com/2a8f98b26166ca9738cf0345ffecc447)

为了实现上述的效果，下面以`<image>`为例，阐述几种常见的实现`background-clip:border-box`属性的方法。需要绘制的view对应的weex描述为

        <image src="http://www.fresher.ru/manager_content/images2/kadry-veka/big/2-1.jpg" 
              style="width:300px; height:300px; background-color:#0000ff;margin:50px;
              box-sizing:border-box;
              padding: 20px;
              border-color:#000000;
              border-radius: 150px"></image>

#### Clip-Path
Android存在`Canvas.clipPath()`方法，可以把指定的Canvas裁剪成指定的形状。

因此可以先按照上面所述的z轴关系，依次绘制各个区域，绘制的图形均为矩形，矩形的面积为background-color区域的外接矩形。之后利用`Canvas.clipPath()`，裁剪各个区域，得到上述所示的图形。

这个解决方案相对简单，但是存在下面三个缺陷：

* 对于background-color外接矩形上的每一个将被裁剪的像素，均被background-color，content绘制了两次，存在OverDraw问题，性能可能会有一定程度下降。
* 对于API 18以下的android系统，`Canvas.clipPath()`与硬件加速不兼容，需要关闭硬件加速。
* Android的anti-aliasing机制与paint强绑定，由于`Canvas.clipPath()`与paint无关，所以不支持anti-aliasing，可能会导致锯齿的出现。

下图是在API 19的Android手机上，渲染<image>的效果，可以看到，content与padding区域的交接处，出现了明显的spatial-aliasing。

![image-clip-path](http://ata2-img.cn-hangzhou.img-pub.aliyun-inc.com/f70aad496929152c2a459e62d7067b92)

#### Porter-Duff
[Porter-Duff](http://ssp.impulsetrain.com/porterduff.html)是一种alpha-composing的方式，也可以视为blend-mode问题的一个子集。Porter-Duff描述了在GPU渲染时，同时存在区域a和区域b，把区域a和区域b叠加在一起的方式。使用porter-duff，可以实现把区域a和区域b按照z-index叠加或区域a作为区域b的蒙版等效果。

例如对于如下两张图片

![porter-duff-source](http://ssp.impulsetrain.com/porterduff/source.png), ![porter-duff-dst](http://ssp.impulsetrain.com/porterduff/dest.png)

使用不同的porter-duff叠加方式，可以得到如下叠加结果结果

![porter-duff-result](http://ssp.impulsetrain.com/porterduff/table.png)

可以使用`Paint.setXfermode(PorterDuffXfermode)`来指定porter-duff叠加方式。因此对于image的`background-clip:border-box`问题，可以先画一个content区域的path，并使用任意颜色填充，之后使用`PorterDuffMode.SRC_IN`(即上图中的IN)叠加模式绘制image。伪代码如下：

	function onDraw(canvas)
	  //PorterDuff叠加的是两个bitmap，因此需要保存目前canvas已有的信息，并创建一个新的图层。
      layer=canvas.saveLayer(0,0,getWidth(),getHeight(),null,Canvas.ALL_SAVE_FLAG);
      paint.setColor(Color.BLUE);
      Path path=getContentPath();
      //先在新图层上绘制蒙版
      canvas.drawPath(path,paint);
      
      //下面绘制真正的image，首先设置PorterDuffMode.SRC_IN
      paint.setXfermode(SRC_IN);
      //将待绘制的image绘制到一个名为extra的Canvas上
      super.onDraw(extra);
      //每个Canvas都对应于一个bitmap，把extra Canvas对应的bitmap取出，绘制到当前的canvas上
      canvas.drawBitmap(getCanvasBitmap(bitmap),0,0,paint);
      paint.setXfermode(null);
      //恢复正常图层
      canvas.restoreToCount(layer);
   


Porter-Duff可以解决spatial-aliasing的问题，但依然存在下面两个问题

* Overdraw问题依然没有解决
* 需要额外创建一个bitmap来保存蒙版信息，会造成额外的内存消耗。对于这个bitmap的每一个像素，如果使用[RGB_565](https://developer.android.com/reference/android/graphics/Bitmap.Config.html)方式存储，需要2个字节，因此对于一个`720*1024`的view，需要额外`2*720*1024=1440kb`额外内存。通常view会存在叠加关系，这导致所需额外内存可能会很多。

使用Porter-Duff方法，得到如下绘制效果，可以看到spatial-aliasing少了很多。

![porter-duff-draw](http://ata2-img.cn-hangzhou.img-pub.aliyun-inc.com/a9eb5713f7e8fbb3c1e90c94e826a01b)


#### Shader

在Android中，Path描述一个闭合的contour或者一条开放的线，而Shader描述对这个contour着色的方式。故可以先计算content区域对应的Path，再把图片作为Shader，填充Path区域。

这种方法可以解决OverDraw，spatial-aliasing和低版本API兼容问题，且不带来额外的内存消耗。Shader方案的伪代码如下：

      function onDraw()
          bounds = getBounds();
          path = borderDrawable.getContentPath();
          //由于bitmap的大小可能和view的小不一致，因此需要进行缩放。
          matrix.setScale(bounds.width() / bitmap.getWidth(),
                          bounds.height() / bitmap.getHeight());
          BitmapShader bitmapShader = new BitmapShader(bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP);
          bitmapShader.setLocalMatrix(matrix);
          mPaint.setStyle(Paint.Style.FILL);
          mPaint.setShader(bitmapShader);
          canvas.drawPath(path, mPaint);

得到如下渲染效果

![shader](http://ata2-img.cn-hangzhou.img-pub.aliyun-inc.com/bc0ac2f59907231a3bdb49a13bf8bd07)

然而Shader方式的局限性较强，只有当Shader可以映射到Bitmap的时候，才可以使用这种方案。对于一个`<text>`，无法直接得到其对应的bitmap方式，也就无法使用Shader方案。

对比shader和Porte-Duff方案，有如下结论：

* Shader方案的通用性较差，只能针对bitmap元素，但是没有额外的内存消耗。当`<image>`能映射到bitmap的时候，可用shader方案处理`background-clip:border-box`属性。
* Porter-Duff方案通用性较强，但需要额外的内存。当某一个tag无法映射到bitmap的时候，使用Porter-Duff方案。


### Path Too Large To Be Rendered To a Texture
当使用Path描述border的一条边的时候，如果某一条边长度超过一个值，OpenGL ES就会拒绝这条边对应的渲染指令，并抛出[Path Too Large To Be Rendered To a Texture](http://stackoverflow.com/a/15208783/2409400)异常。

这是由于在Android中，Path是使用CPU绘制，且硬件加速默认处于开启状态。这个时候，CPU将先把Path绘制到bitmap上，之后把bitmap上传到GPU的Texture存储区域中。由于Texture的存储空间有限，如果Path过长，会导致Texture溢出，后果就是这条渲染指令无法执行。

为了解决这个问题，可以使用`Canvas.drawLine()`来画border的一条边，CPU将负责这个draw操作，不存在OpenGL ES渲染操作，也就不会出现上述异常。

在使用Path描述border的一条边的时候，可以同时使用`PathEffect`来描述`border-style`。如果使用了`Canvas.drawLine()`替代`Canvas.drawPath()`，将无法使用`PathEffect`。为此，可以使用`LinearGradient`来实现`border-style`。

`LinearGradient`是一种Shader，一般用来实现颜色渐变。为了实现`border-x-style:dashed`或`border-x-style:dotted`效果，可以通过将渐变区域的长度设置为0，渐变颜色分别设置为`border-x-color`和`transparent`来解决此问题。

## 对比
React Native Android和Weex Android在解决border问题上都采取了类似的方案，即自定义`Drawable`对象，在Canvas上把border画出来。然而在如何绘制border这个方面，React Native Android和Weex Android存在着明显的区别，对`border-x-width`, `border-x-color`, `border-x-style`, `border-x-y-radius`的支持能力也有明显差异，在细节的处理上也有不同之处。

### Pros
Weex Android对border支持能力比React Native Android强，对一些corner case也有一定程度的支持。具体列举如下

* 全面支持`border-x-width`, `border-x-color`, `border-x-style`, `border-x-y-radius`四个属性。
    * React Native Android不支持`border-x-style`，只支持`border-style`
    * 如果存在`border-x-y-radius`，则`border-x-color`,`border-y-color`失效，退化成`border-color`；`border-x-width`, `border-y-width`也会失效，退化成`border-width`。
* Weex Android支持某条border超过6000像素，而React Native Android会拒绝渲染这条边。
* Weex Android对图片的`border-radius`支持不依赖于图片库，开发者可以自行更换图片库而不影响border，而React Native Android的`border-radius`依赖于fresco图片库。


### Cons
Weex Android对border邻接两边的过渡区域处理不够圆滑，当border同时满足下面两个条件的时候

* `border-x-y-radius`大于0
* `border-x-width` != `border-y-width`

此时过渡区域无法满足[CSS Recommendation](https://www.w3.org/TR/css3-background/#corner-transitions)中对过渡区域的定义
> the center of color and style transitions between adjoining borders is a point along the curve that is a continuous monotonic function of the ratio of the border widths.

而React Native Android由于在`border-x-y-radius`存在时，`border-x-width`和`border-y-width`会退化成`border-width`，不按照前端指定的CSS属性渲染，因此不满足上述前置条件，从而使得此问题不会发生。

例如对于这段weex代码片段
    
    <img src="http://www.fresher.ru/manager_content/images2/kadry-veka/big/2-1.jpg" 
              style="width:200px; height:300px; background-color:#0000ff;margin:50px;
              box-sizing:border-box;
              padding: 20px;
              border-color:#000000;
              border-style:solid;
              border-top-width: 30px;
              border-left-width: 50px;
              border-right-width: 30px;
              border-top-left-radius: 180px;
              border-top-right-radius: 220px"/>

获得了如下的渲染效果，可以看到下图中left-edge和top-edge的过渡区域不够圆滑。

![Weex_RN_Pro_Con](http://ata2-img.cn-hangzhou.img-pub.aliyun-inc.com/6c67813eb7cd6e0f00de2d7e8f1f4ac3)

## 总结
Weex Android和React Native Android对border的整体解决方案类似。在实现细节上，

* React Native Android选择支持更少的corner case，在一些情况下，可能会不依照前端指定的CSS属性渲染，从而使得渲染效果符合CSS Recommendation。
* Weex Android选择支持尽可能多的corner case，兼容前端的各种border写法，但可能会牺牲border邻接两边的过渡区域的渲染效果。

## 参考文章
* https://www.w3.org/TR/css3-background/#corners
* http://blog.xianqu.org/2012/04/android-borders-and-radius-corners/
* http://ssp.impulsetrain.com/porterduff.html
* https://github.com/barthand/android-pathbitmap