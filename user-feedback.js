// Write your package code here!
UI.registerHelper('ufbmatches', function(foo, bar1, bar2, bar3, bar4) {
  return (foo === bar1 || foo === bar2 || foo === bar3 || foo === bar4);
});

UI.registerHelper('ufbsort', function(array, field, ord) {
	console.log('sort called '+array+' '+field +" ord "+ ord);
	if(ord === "desc")
		return _.sortBy(array, function(item){ return -item[field]; });
	return _.sortBy(array, function(item){ return item[field]; });
});



function ufbFormatDate(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ampm;
  return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + " " + strTime;
}
UI.registerHelper('ufbFormatDate',function(date){
    return ufbFormatDate(date);
});

Template.userfblink.helpers({
	showFb: function(){
		return Session.get('showFb');
	}
});
Template.userfblink.events({
	"click .ufb-button": function (event) {
		//$('.ufb-page').css('display','block');
		Session.set('showFb', true);
    }
});
Template.userfeedback.rendered = function(){
  if (!this.rendered){
    this.rendered = true;
  		Meteor.call("initUFB", function (err, asyncValue) {
			if (err)
				console.log(err);
			else {
				Session.set('ufb-list', asyncValue.topics);
				var newCount = 0;
				if(asyncValue.new)
					newCount = asyncValue.new;
				var solvedCount = 0;
				if(asyncValue.solved)
					solvedCount = asyncValue.solved;
				Session.set('ufb-stats', "New: "+newCount + " / Solved: "+solvedCount);
			}
		});	

  }
};

Template.userfeedback.helpers({
	topicCount: function(){
		return Session.get('ufb-stats');
	},
	categories: function(){
		if(Meteor.settings.public && Meteor.settings.public.userfeedback && Meteor.settings.public.userfeedback.categories){
			return Meteor.settings.public.userfeedback.categories;
		}
		else
			return [{desc: "Feature Ideas", id:"idea"}, 
					{desc:"Technical Issues", id:"issue"},
					{desc:"General Feedback", id:"general"}];
	},
	topicList: function(){
		return Session.get('ufb-list');
	},
	currTopic: function(){
		return Session.get('currTopic');
	},
	readonly: function(){
		var currTopic = Session.get('currTopic');
		if (currTopic.owner == Meteor.userId() || 
				(Meteor.settings.public.userfeedback != null && 
				Meteor.userId() == Meteor.settings.public.userfeedback.moderator)) 
				return null;
		return "readonly";
	}
});
Template.userfeedback.events({
	"click .ufb-close": function (event) {
		Session.set('showFb',false);
    },
    "submit .ufb-search-form": function (event) {
      // This function is called when the new task form is submitted
      var text = $('.ufb-search').val();
      var typ = $('.ufb-type').val();
      Session.set('currTopic', null);
  		Meteor.call("findTopic", text, typ, function (err, asyncValue) {
			if (err)
				console.log(err);
			else {
				Session.set('ufb-list', asyncValue);
			}
		});	
      // Prevent default form submit
      return false;
    },
    "click .ufb-new": function (event) {
      // This function is called when the new task form is submitted
      var text =$('.ufb-search').val();
      Session.set('currTopic', {owner: Meteor.userId(), desc:""});
      return false;
    },
    "click .ufb-save-button": function(event){
	    var currTopic = Session.get("currTopic");
	    var currTopicId;
	    if(currTopic)
	    	currTopicId = currTopic._id;
      var head =$('.ufb-textbox').val();
      var typ =$('.ufb-type').val();
      var desc =$('.ufb-textdesc').val();
  		Meteor.call("setTopic", head, typ, desc, currTopicId, function (err, res) {
  			if(!err){
	  			Session.set('currTopic', res);
	  		}
	  		else
	  			alert(err);
  		});
    },
    "click .ufb-topic": function(e){
		var k = e.target.id;
    	Meteor.call("getTopicDetails", k, function(err, res){
  			if(!err)
	  			Session.set('currTopic', res);
	  		else
	  			alert(err);
    	});
    	return false;
    },
    "click .ufb-comment-save" : function(e){
	    var text =$('.ufb-comment-input').val();
	    $('.ufb-comment-input').val("");
	    var currTopic = Session.get("currTopic");
	    Meteor.call("updateTopic", currTopic._id, "comment", text, function(err, res){
  			if(!err)
	  			Session.set('currTopic', res);
	  		else
	  			alert(err);	    		
	    });
    	return false;    	
    },
    "click .ufb-unlike-button" : function(e){
	    var currTopic = Session.get("currTopic");
	    Meteor.call("updateTopic", currTopic._id, "unlikes", "", function(err, res){
  			if(!err)
	  			Session.set('currTopic', res);
	  		else
	  			alert(err);	    		
	    });
    	return false;  	
    },
    "click .ufb-like-button" : function(e){
	    var currTopic = Session.get("currTopic");
	    Meteor.call("updateTopic", currTopic._id, "likes", "", function(err, res){
  			if(!err)
	  			Session.set('currTopic', res);
	  		else
	  			alert(err);	    		
	    });
    	return false;  	
    },
    "click .ufb-rating-up" : function(e){
	    var currTopic = Session.get("currTopic");
	    var cmtId = e.target.id.substring(3);
	    Meteor.call("updateTopic", currTopic._id, "clikes", cmtId, function(err, res){
  			if(!err)
	  			Session.set('currTopic', res);
	  		else
	  			alert(err);	    		
	    });
    	return false;  	
    },
    "click .ufb-rating-down" : function(e){
	    var currTopic = Session.get("currTopic");
	    var cmtId = e.target.id.substring(3);
	    Meteor.call("updateTopic", currTopic._id, "cunlikes", cmtId, function(err, res){
  			if(!err)
	  			Session.set('currTopic', res);
	  		else
	  			alert(err);	    		
	    });
    	return false;  	
    },
    "change .ufb-status" : function(e){
    	var val =  $('#'+e.target.id).val();
		if($('#'+e.target.id).attr('orig') !== val){
		    var currTopic = Session.get("currTopic");
			console.log('combobox '+e.target.id+'='+val);
		    Meteor.call("updateTopic", currTopic._id, "status", val, function(err, res){
	  			if(!err)
		  			Session.set('currTopic', res);
		  		else
		  			alert(err);	    		
		    });
		}

    }
});