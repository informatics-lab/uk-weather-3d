#!/bin/sh

WMS_CAP="http://webmap.daac.ornl.gov/ogcbroker/wms?originator=SDAT2&service=WMS&version=1.1.1&request=GetCapabilities"

WCS_COV="http://webmap.daac.ornl.gov/cgi-bin/mapserv?&coverage=10003_1&request=DescribeCoverage&map=/sdat/config/mapfile//10003/10003_1_wcs.map&service=WCS&originator=SDAT2&version=1.0.0"



MY_DEM="http://python-wetoffice.rhcloud.com/dembin?bbox=-12,50,3.5,59&crs=EPSG:4326&format=AAIGrid_INT16&height=256&request=GetCoverage&width=256"
DEM="http://webmap.daac.ornl.gov/cgi-bin/mapserv?map=/sdat/config/mapfile//10003/10003_1_wcs.map&service=WCS&originator=SDAT2&version=1.0.0&coverage=10003_1&bbox=-12,50,3.5,59&crs=EPSG:4326&format=AAIGrid_INT16&height=256&request=GetCoverage&width=256"

WMS_URI="http://webmap.daac.ornl.gov/cgi-bin/mapserv?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1"
WMS_INFO="&map=/sdat/config/mapfile//10003/10003_1_wms.map&LAYERS=10003_1_band1&originator=SDAT2"
WMS_FMT="&STYLES=&TRANSPARENT=true&FORMAT=image/png"
#WMS_RGN="&height=485&width=970&SRS=EPSG:4326&bbox=-136.20618556701,-66.061855670098,43.793814432989,23.938144329902"
WMS_RGN_H="&height=2048&width=2048&SRS=EPSG:4326&bbox=-12,50,3.5,59"
WMS_RGN_L="&height=32&width=32&SRS=EPSG:4326&bbox=-12,50,3.5,59"
echo "Fetching DEM"
echo "${DEM}"
curl "${DEM}" > dem_new.bin

WMS_UK_H="${WMS_URI}${WMS_INFO}${WMS_FMT}${WMS_RGN_H}"
WMS_UK_L="${WMS_URI}${WMS_INFO}${WMS_FMT}${WMS_RGN_L}"
#echo "Fetching WMS capabilities"
#curl "${WMS_CAP}" >wms_cap.xml
#curl "${WMS_UK_H}">uk_hi.png
#curl "${WMS_UK_L}">uk_lo.png
