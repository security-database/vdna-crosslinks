<?php
/* Simple Crosslinks Wrapper */

// Security-Database handle Alert and Depth Errors
$url = "http://crosslinks.security-database.com/crosslinks.php?alert=".$_GET["alert"]."&depth=".$_GET["depth"];

$rawdata = "";
$rawdata = file_get_contents($url);

print $rawdata;
