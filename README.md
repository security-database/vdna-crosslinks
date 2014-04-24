vDNA Crosslinks
===============

Security-Database vDNA Crosslinks
---------------------------------

vDNA Crosslinks allows you to gather +80.000 security alerts data from [Security-Database](https://www.security-database.com) and export it as JSON. Export provide related alert information. By that we mean, all alerts linked to the first one at specified depth. We limit the depth from 0 (single) to 4, but on demand, we can override this value.

On this 'simple' exemple, we use D3.js library and CoffeeScript to manipulate and represent links bewteen alerts and severity propagation. Hope you'll like it.

[Security-Database](https://www.security-database.com) provides this information for free for anybody who want to play with, make graphs, stats, publish or anything else. Hope you'll enjoy playing with it and perhaps, let you have some idea ;)



The endpoint
------------

The endpoint is hosted by Security-Database. Datas are generated daily, queries and results cached for a maximum performance.

[http://crosslinks.security-database.com/crosslinks.php?alert=[alert]&depth=[depth]](http://crosslinks.security-database.com/crosslinks.php?alert=[alert]&depth=[depth])

This endpoint verify that the Alert name entered is conform (ie : CVE-2012-2010 or MS10-021) and verify that the depth is between 0 and 4 (integer only). Depth 0 will be selected alert only.

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
- severity : Source alert severity (Critical, High, Medium, Low or NA)
- id : Alert Name (SD naming scheme)
- vendor : Source vendor (Microsoft, cve, HP...)
- published : Source published date (YYYY-MM-DD)
- type : Actually Alerts, perhaps some other later
- links : Numbers of links from this alert (integer)

##### Datas (Links)
- source : id From
- target : id To    
    
    
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
- Exemple : Depth, must be between 0 and 4 (0 is selected alert only)


##License

This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License.

__You are free to:__

- __Share__ — copy and redistribute the material in any medium or format
- __Adapt__ — remix, transform, and build upon the material

	for any purpose, even commercially.

__Under the following terms:__

- __Attribution__ — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

	What does "Attribute this work" mean?

	The page you came from contained embedded licensing metadata, including how the creator wishes to be attributed for re-use. You can use the HTML here to cite the work. Doing so will also include metadata on your page so that others can find the original work as well.
- __ShareAlike__ — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
