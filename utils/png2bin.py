from PIL import Image, ImageDraw
import array
import StringIO

im = Image.open( "uk_hi.png" )
print im.info
print im.size
colors = im.getcolors()
print colors
height=64
width=512
cbar = Image.new( "RGBA", (width,height), (0,0,0,0) )
# get a drawing context
d = ImageDraw.Draw( cbar )


print len(colors[:-1])
cellwidth = width/len(colors[:-1])
x0=0
for c in colors[:-1]:
    (n, rgba) = c
    print rgba
    d.rectangle([(x0,0),(x0+cellwidth,height)],fill=rgba)
    x0 += cellwidth

cbar.save( "cbar.png" )

def getIndex( pix ):
    idx = 0
    for c in colors:
        (n,rgba) = c
        if pix == rgba:
            return idx
        idx += 1
    return -1

for y in range(100,600):
    for x in range(width):
        v = im.getpixel((x,y))
        n = getIndex( v )
        if n == 9:
            im.putpixel((x,y),(255,0,0,255))

im.save( "new.png" )
