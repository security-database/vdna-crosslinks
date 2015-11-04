<?php
/* Simple Crosslinks Wrapper */

// Security-Database handle Alert and Depth Errors
$url = "http://crosslinks.security-database.com/crosslinks.php?alert=".$_GET["alert"]."&depth=".$_GET["depth"];

$opts = array('http' =>
  array(
    'header'  => "Content-Type: application\/json"
  )
);

$context =  stream_context_create($opts);
$rawdata = "";
$rawdata = file_get_contents($url, false, $context);

print $rawdata;
