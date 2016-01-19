<?php

$alert = "";
$depth = "";

$error["alert"] = 0;
$error["depth"] = 0;
$alert_get = 0;
$depth_get = 0;


// Check Alert Name

if (isset($_GET["alert"]) == true) {
    // Security-Database alert_name.php handle Alert naming error and return 0 (error) or 1 (success)
    $result = file_get_contents("http://crosslinks.security-database.com/alert_name.php?alert=".$_GET["alert"]);

    if ($result == 1) {
        $alert = $_GET["alert"];
        $alert_to_view = $_GET["alert"];
        $alert = str_replace('#', '', $alert_to_view);
        $alert_get = 1;
    } else {
        $alert = "";
        $alert_to_view = "";
        $error["alert"] = 1;
    }
} else {
    // Sample exemmples
    $input = array("MS10-039", "GLSA-201308-06", "USN-1187-1", "USN-1332-1", "HPSBUX02689-SSRT100494", "TA10-040A");
    $rand_keys = array_rand($input, 2);
    $alert_to_view = $input[$rand_keys[0]];
    $alert = str_replace('#', '', $alert_to_view);
}


if (isset($_GET["depth"]) == true) {
    if ((int)$_GET["depth"] > -1 && (int)$_GET["depth"] < 5) {
        $depth = (int)$_GET["depth"];
        $depth_get = 1;
    } else {
        $error["depth"] = 1;
    }
} else {
    $depth = 3;
}


?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="vDNA Crosslinks by Security-Database allow you to gather Security Alerts information and play with">
        <title>vDNA Crosslinks <?php if ($alert_get == 1 && $depth_get == 1) { print " : ".$alert_to_view." at depth : ".$depth; } ?></title>



        <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/pure/0.6.0/pure-min.css">

        <link rel="stylesheet" type="text/css" href="/css/menu.css">
        <link rel="stylesheet" type="text/css" href="/css/style.css">
        <link rel="stylesheet" type="text/css" href="/opentip/opentip.css" />


        <script type="text/javascript">
            var sname = <?php echo "'".$alert."'"; ?>;
            var sdepth = <?php echo "'".$depth."'"; ?>;
        </script>
    </head>
<body>
<div id="tooltip2" class="tooltip2"></div>
<div id="layout">
    <div id="main">


        <?php
        if ($error["alert"] == 1) {
        ?>
        <div>
            <button class="pure-button pure-button-error">Alert is not valid</button>
        </div>
        <?php
         } elseif ($error["depth"] == 1) {
        ?>
        <div>
            <button class="pure-button pure-button-error">Depth is not valid</button>
        </div>
        <?php
        }
        ?>


        <a name="introduction"></a>
        <div class="header">
            <h1>vDNA Crosslinks</h1>
            <h2>Play with it!</h2>
        </div>


        <div class="content">


            <p>vDNA Crosslinks allows you to gather +80.000 security alerts data from <a href="https://www.security-database.com/" target="_blank">Security-Database</a> and export it as JSON.
            Export provide related alert information. By that we mean, all alerts linked to the first one at specified depth. We limit the depth from 0 (single) to 4, but on demand, we can override this value.</p>

            <h2 id="introduction-to-pure-grids" class="content-subhead">vDNA Crosslinks Demo<?php if (isset($alert)) { echo ' for : <a href="https://www.security-database.com/detail.php?alert='.$alert.'" target="_blank">'.$alert_to_view.'</a>'; if (isset($depth) == true) {print ' at depth : '.$depth;}}?></h2>

            <div id="c">
                <div id="controls2">
                  <div id="layouts" class="control">
                      <h3>Layout</h3>
                      <a id="force" class="active">Force</a>
                      <a id="radial">Severity</a>
                  </div>
                </div>
                <div id="controls">
                  <div id="filters_severity" class="control">
                    <h3>Severity Filter</h3>
                    <a id="Critical" class="active">Critical</a>
                    <a id="High" class="active">High</a>
                    <a id="Medium" class="active">Medium</a>
                    <a id="Low" class="active">Low</a>
                    <a id="NA" class="active">N/A</a>
                  </div>

                  <div id="filters_vendors" class="control">
                    <h3>Vendor Filter</h3>
                    <a id="cve" class="active">CVE</a>
                    <a id="Microsoft" class="active">Microsoft</a>
                    <a id="Mandriva" class="active">Mandriva</a>
                    <a id="RedHat" class="active">Redhat</a>
                    <a id="Debian" class="active">Debian</a>
                    <a id="Ubuntu" class="active">Ubuntu</a>
                    <a id="Gentoo" class="active">Gentoo</a>
                    <a id="Cisco" class="active">Cisco</a>
                    <a id="US-CERT" class="active">US-CERT</a>
                    <a id="VU-CERT" class="active">VU-CERT</a>
                    <a id="HP" class="active">HP</a>
                    <a id="Sun" class="active">Sun</a>
                    <a id="VMware" class="active">VMware</a>
                  </div>
                  <!--
                  <div id="filters_exploits" class="control">
                    <h3>Exploit Filter</h3>
                    <a id="Nessus" class="active">Nessus</a>
                    <a id="Metasploit" class="active">Metasploit</a>
                    <a id="OpenVas" class="active">OpenVas</a>
                    <a id="Snort" class="active">Snort</a>
                  </div>
                  -->
              </div>
            </div>
            <div id="main2" role="main">
                <div class="result grid-example2" id="result"></div>
            </div>

            <form class="pure-form" name="alert_form" method="get" action="?">
                <fieldset>
                    <label for="alert">Search</label>
                    <input id="alert" type="text" name="alert" placeholder="<?php echo $alert; ?>" value="<?php if (isset($_GET['alert']) == true) { echo $alert;} ?>">
                    <label for="state">Depth</label>
                    <select id="state" name="depth">
                        <option <?php if ($depth == 0) { echo "selected"; } ?>>0</option>
                        <option <?php if ($depth == 1) { echo "selected"; } ?>>1</option>
                        <option <?php if ($depth == 2) { echo "selected"; } ?>>2</option>
                        <option <?php if ($depth == 3) { echo "selected"; } ?>>3</option>
                        <option <?php if ($depth == 4) { echo "selected"; } ?>>4</option>
                    </select>

                    <button id='submit' value="submit" type="submit" class="pure-button pure-button-primary">Submit</button>
                </fieldset>
            </form>

            <a name="endpoint"></a>
            <h2 id="the-foundation" class="content-subhead">The endpoint</a></h2>
            <p>
                The endpoint is hosted by <a href="https://www.security-database.com/" target="_blank">Security-Database</a>.
                Datas are generated daily, queries and results cached for a maximum performance.
            </p>
            <pre class="snippet" data-language="html"><code><a href="http://crosslinks.security-database.com/crosslinks.php" target="_blank" title="Security-Database">http://crosslinks.security-database.com/crosslinks.php?alert=[alert]&depth=[depth]</a></code></pre>
            <p>
                This endpoint verify that the Alert name entered is conform (ie : CVE-2012-2010 or MS10-021) and verify that the depth is between 0 and 4 (integer only). Depth 0 will be selected alert only.
            </p>
        </div>


    <div class="footer">
        <div class="legal pure-g">
            <div class="pure-u-1 pure-u-sm-2-5">
                <p class="legal-license">This site is built using <a href="http://purecss.io/" target="_blank" alt="PureCss">Pure</a></p>
            </div>
            <div class="pure-u-1 pure-u-sm-1-5"></div>
            <div class="pure-u-1 pure-u-sm-2-5">
                <ul class="legal-links"><li><a href="https://www.security-database/" target="_blank">Security-Database</a></li></ul>
                <p class="legal-copyright">&copy; <?php echo date('Y'); ?> Security-Database All rights reserved.</p>
            </div>
        </div>
    </div>

</div>



<script type="text/javascript"  src="/grapher/grapher.js"></script>
<script type="text/javascript"  src="/grapher/center.js"></script>
<script type="text/javascript"  src="/grapher/zoom.js"></script>
<script type="text/javascript"  src="https://cdnjs.cloudflare.com/ajax/libs/spin.js/2.3.2/spin.min.js"></script>
<script type="text/javascript"  src="https://code.jquery.com/jquery-2.1.4.min.js"></script>
<script type="text/javascript"  src="/opentip/opentip-jquery-excanvas.js"></script>
<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/d3/3.3.11/d3.min.js"></script>
<script type="text/javascript"  src="/js/crosslinks.js"></script>



</body>
</html>