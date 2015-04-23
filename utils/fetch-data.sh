#!/bin/sh

DEM="http://python-wetoffice.rhcloud.com/dembin?bbox=-12,50,3.5,59&crs=EPSG:4326&format=AAIGrid_INT16&height=256&request=GetCoverage&width=256"
WCS="http://python-wetoffice.rhcloud.com/capbin?REQUEST=GetCoverage&SERVICE=WCS&VERSION=1.0&WIDTH=256&HEIGHT=256&BBOX=-12,50,3.5,59&CRS=EPSG:4326"

LOW1="&COVERAGE=UKPPBEST_Low_cloud_cover&ELEVATION=0-1500m&model=UKPPBEST&DIM_FORECAST=PT1H"
LOW2="&COVERAGE=UKPPBEST_Low_cloud_cover&ELEVATION=0-1500m&model=UKPPBEST&DIM_FORECAST=PT2H"
LOW3="&COVERAGE=UKPPBEST_Low_cloud_cover&ELEVATION=0-1500m&model=UKPPBEST&DIM_FORECAST=PT3H"
LOW4="&COVERAGE=UKPPBEST_Low_cloud_cover&ELEVATION=0-1500m&model=UKPPBEST&DIM_FORECAST=PT4H"
MED1="&COVERAGE=UKPPBEST_Medium_cloud_cover&ELEVATION=1500-4500m&model=UKPPBEST&DIM_FORECAST=PT1H"
MED2="&COVERAGE=UKPPBEST_Medium_cloud_cover&ELEVATION=1500-4500m&model=UKPPBEST&DIM_FORECAST=PT2H"
MED3="&COVERAGE=UKPPBEST_Medium_cloud_cover&ELEVATION=1500-4500m&model=UKPPBEST&DIM_FORECAST=PT3H"
MED4="&COVERAGE=UKPPBEST_Medium_cloud_cover&ELEVATION=1500-4500m&model=UKPPBEST&DIM_FORECAST=PT4H"
HIG1="&COVERAGE=UKPPBEST_High_cloud_cover&ELEVATION=4500-4400m&model=UKPPBEST&DIM_FORECAST=PT1H"
HIG2="&COVERAGE=UKPPBEST_High_cloud_cover&ELEVATION=4500-4400m&model=UKPPBEST&DIM_FORECAST=PT2H"
HIG3="&COVERAGE=UKPPBEST_High_cloud_cover&ELEVATION=4500-4400m&model=UKPPBEST&DIM_FORECAST=PT3H"
HIG4="&COVERAGE=UKPPBEST_High_cloud_cover&ELEVATION=4500-4400m&model=UKPPBEST&DIM_FORECAST=PT4H"
echo "Fetching low cloud"
echo "${WCS}${LOW1}"
curl "${WCS}${LOW1}" > cld_low1.bin
echo "${WCS}${LOW2}"
curl "${WCS}${LOW2}" > cld_low2.bin
echo "${WCS}${LOW3}"
curl "${WCS}${LOW3}" > cld_low3.bin
echo "${WCS}${LOW4}"
curl "${WCS}${LOW4}" > cld_low4.bin
echo "Fetching medium cloud"
echo "${WCS}${MED1}"
curl "${WCS}${MED1}" > cld_med1.bin
echo "${WCS}${MED2}"
curl "${WCS}${MED2}" > cld_med2.bin
echo "${WCS}${MED3}"
curl "${WCS}${MED3}" > cld_med3.bin
echo "${WCS}${MED4}"
curl "${WCS}${MED4}" > cld_med4.bin
echo "Fetching high cloud"
echo "${WCS}${HIG1}"
curl "${WCS}${HIG1}" > cld_hig1.bin
echo "${WCS}${HIG2}"
curl "${WCS}${HIG2}" > cld_hig2.bin
echo "${WCS}${HIG3}"
curl "${WCS}${HIG3}" > cld_hig3.bin
echo "${WCS}${HIG4}"
curl "${WCS}${HIG4}" > cld_hig4.bin
echo "Fetching DEM"
echo "${DEM}"
curl "${DEM}" > dem.bin
