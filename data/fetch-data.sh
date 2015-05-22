#!/bin/sh

DEM="http://python-wetoffice.rhcloud.com/dembin?bbox=-12,50,3.5,59&crs=EPSG:4326&format=AAIGrid_INT16&height=256&request=GetCoverage&width=256"
WCS="http://python-wetoffice.rhcloud.com/capbin?REQUEST=GetCoverage&SERVICE=WCS&VERSION=1.0&WIDTH=256&HEIGHT=256&BBOX=-12,50,3.5,59&CRS=EPSG:4326"
MED="&COVERAGE=UKPPBEST_Medium_cloud_cover&ELEVATION=1500-4500m&model=UKPPBEST"
LOW="&COVERAGE=UKPPBEST_Low_cloud_cover&ELEVATION=0-1500m&model=UKPPBEST"
HIG="&COVERAGE=UKPPBEST_High_cloud_cover&ELEVATION=4500-4400m&model=UKPPBEST"
echo "Fetching low cloud"
echo "${WCS}${LOW}"
curl "${WCS}${LOW}" > cld_low.bin
echo "Fetching medium cloud"
echo "${WCS}${MED}"
curl "${WCS}${MED}" > cld_med.bin
echo "Fetching high cloud"
echo "${WCS}${HIG}"
curl "${WCS}${HIG}" > cld_hig.bin
echo "Fetching DEM"
echo "${DEM}"
curl "${DEM}" > dem.bin
