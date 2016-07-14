$(document).ready(function(){
	
	//Check to see if the window is top if not then display button
	$(window).scroll(function(){
		var height = $(window).height();
		if ($(this).scrollTop() > height/2) {
			$('.scrollToTop').fadeIn();
		} else {
			$('.scrollToTop').fadeOut();
		}
	});
	
	//Click event to scroll to top
	$('.scrollToTop').click(function(){
		$('html, body').animate({scrollTop : 0},800);
		return false;
	});
	
	// Global variables needed by Disqus. The identifier and url should be different for each comment thread.
	var disqus_shortname = 'maxlancaster';
	var disqus_identifier;
	var disqus_url;

	// Loads the Disqus JS file that will create the comment form and threads.
	var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
	dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js'; // Found in disqus.js script
	$('head').append(dsq);

	// Called in each location you want to show the thread.

	// Disqus searches for 'disqus-thread' elements and uses the first one it finds so to
	// overcome this, the function will clear any previous comment threads (by finding 'comments-load' elements)
	// 
	loadDisqus = function(element, postTitle, postUrlTag) {
	  var identifier = postTitle;

	  // Including the hashbang ('/#!') is important.
	  var url = window.location.origin + '/#!' + postUrlTag;

	  var disqus_identifier = identifier;
	  var disqus_url = url;

	  if (window.DISQUS) {
	    // Horrible, but jQuery wasn't removing the div elements fully
	    $( ".comments" ).each(function() {
	      var len = this.childNodes.length;
	      for(var i = 0; i < len; i++)
	      {  
	        if (this.childNodes[i].tagName == "DIV") {
	          this.removeChild(this.childNodes[i]);
	        } 
	      }
	    });

	    $(element).append('<div class="disqus-thread" id="disqus_thread"></div>');

	    /** if Disqus exists, call it's reset method with new parameters **/
	    DISQUS.reset({
	      reload: true,
	      config: function () { 
	        //important to convert it to string
	        this.page.identifier = identifier.toString();    
	        this.page.url = url;
	      }
	    });
	  }
	};
	
});