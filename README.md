vDNA Crosslinks
===============

Security-Database vDNA Crosslinks
---------------------------------

vDNA Crosslinks allows you to gather +80.000 security alerts data from [Security-Database](https://www.security-database.com) and export it as JSON. Export provide related alert information. By that we mean, all alerts linked to the first one at specified depth. We limit the depth from 0 (single) to 4, but on demand, we can override this value.

On this 'simple' exemple, we use D3.js library and CoffeeScript to manipulate and represent links bewteen alerts and severity propagation. Hope you'll like it.

[Security-Database](https://www.security-database.com) provides this information for free for anybody who want to play with, make graphs, stats, publish or anything else. Hope you'll enjoy playing with it and perhaps, let you have some idea ;)

Live Demo
--------

A live demo and self promo web site is actually available here : [http://crosslinks.security-database.com](http://crosslinks.security-database.com). You can play with alerts, data, filters, layout.


The endpoint
------------

The endpoint is hosted by Security-Database. Datas are generated daily, queries and results cached for a maximum performance.

[http://crosslinks.security-database.com/crosslinks.php?alert=[alert]&depth=[depth]](http://crosslinks.security-database.com/crosslinks.php?alert=[alert]&depth=[depth])

This endpoint verify that the Alert name entered is conform (ie : CVE-2012-2010 or MS10-021) and verify that the depth is between 0 and 4 (integer only). Depth 0 will be selected alert only.


Exemples
--------
### Force layout 
![Force layout ](/samples/Force.jpg?raw=true)

### Force layout 
![Severity layout ](/samples/Severity.jpg?raw=true)


Output Sample
-------------

###Success : Json ouput Exemple
#### Sample :

```json
{
    "success" : true,
    "message" :
        {
        "nodes" : [ {
            "severity" : "Medium",
            "id" : "KB983438",
            "vendor" : "Microsoft",
            "published" : "2010-05-12",
            "type" : "Alerts",
            "links" : 2
        },{(...)}],
        "links" : [ {
            "source" : "MS11-044",
            "target" : "MS12-034"
        },{(...)}]
        }
}
```

#### Definition : 
##### Datas (Nodes)
- __severity__ : Source alert severity (Critical, High, Medium, Low or NA)
- __id__ : Alert Name (SD naming scheme)
- __vendor__ : Source vendor (Microsoft, cve, HP...)
- __published__ : Source published date (YYYY-MM-DD)
- __type__ : Actually Alerts, perhaps some other later
- __links__ : Numbers of links from this alert (integer)

##### Datas (Links)
- __source__ : id From
- __target__ : id To    
    
    
###Error : Json ouput Exemple
#### Sample :
```json
{
	"success" : false,
		"message" : [
	        {
	            "error" : "depth : No specified Depth, must be between 0 and 4"
	        }
	    ]
}
```
#### Definition : 
- __Exemple__ : Depth, must be between 0 and 4 (0 is selected alert only)
