UserFeedback = new Mongo.Collection("userfeedback");
var stats;
Meteor.methods({
  initUFB: function(){
  		if(!stats){
  			var topicStatus = UserFeedback.find({},{fields:{"status":1}}).fetch();
  			stats = _.countBy(topicStatus,'status');
  			stats.atTime = new Date();
  			var sort_order = {};
			sort_order["likes"] = -1;
			//return articles.find({}, {sort: sort_order, limit: 1});
  			stats.topics = UserFeedback.find({}, {sort:sort_order, limit: 15, fields:{'head':1, 'date':1, 'likes':1, 'unlikes':1, 'category':1, '_id':1, 'status':1, 'commentCount':1}}).fetch();
  			console.log('got stats'+JSON.stringify(stats));
  		}
  		return stats;
  },
  findTopic: function (text, type, pageNo) {
    check(text, String);
	check(type, String);

//	Messages.insert({message:msgString, fromName: Meteor.user().username, from:Meteor.userId(), to:toUser, toName:toName, atTime: now, replyTo: replyTo, ref:reference, readStatus:0});
//	var res = [{head:"this is topic1", date:"5/22"},{head:"what happen", date:"5/23"}];
//	UserFeedback._ensureIndex("head");
	var res = UserFeedback.find({"$text":{"$search":text}}, 
		{ fields: {'head':1, 'date':1, 'likes':1, 'unlikes':1, 'category':1, '_id':1, 'status':1, 'commentCount':1 }}).fetch();


	console.log('got res - '+res.length);
	return res;	
  },
  newTopic: function (head, typ, desc) {
	if (! Meteor.userId()) 
		throw new Meteor.Error("log in to create new topic");
    check(head, String);
	check(typ, String);
    check(desc, String);

	var topic = {head: head, date: new Date(), type: typ, desc: desc, likes:0, unlikes:0, category:typ, commentCount: 0, comments:[], userSet:{}, status: 'new' };
	topic.owner = Meteor.userId();
	var id = UserFeedback.insert(topic);
    return UserFeedback.findOne({'_id': id});
  },
  getTopicDetails: function (topicId) {
    check(topicId, String);
	return UserFeedback.findOne({_id: topicId});
  },
  updateTopic: function (topicId, type, comment) {
	if (! Meteor.userId()) 
		throw new Meteor.Error("log in to type on topic");
    check(comment, String);
	check(type, String);
	console.log('updaing topic '+topicId);
	var ufb = UserFeedback.findOne({'_id': topicId}, {fields:{'likes':1, 'unlikes':1, userSet:1, commentCount:1}});
	var uId = Meteor.userId();
	if(type == 'likes'){
		if(!ufb.userSet[uId]){
			var updateSet = {"likes": ufb.likes + 1};
			updateSet["userSet."+uId] = 1;
			UserFeedback.update({'_id': topicId},{"$set":updateSet}); 
		}
	}
	else if(type == 'unlikes'){
		if(!ufb.userSet[uId]){
			var updateSet = {"unlikes": ufb.unlikes + 1};
			updateSet["userSet."+uId] = 1;
			UserFeedback.update({'_id': topicId},{"$set": updateSet}); 
		}
	}
	else if(type == 'clikes'){
		console.log('updaing clikes '+comment);
		UserFeedback.update({_id: topicId, "comments.id" : parseInt(comment)},
			{ "$inc": { "comments.$.rating" : 1 } });
	}
	else if(type == 'cunlikes'){
		console.log('updaing cunlikes '+comment);
		UserFeedback.update({_id: topicId, "comments.id" : parseInt(comment)},
			{ "$inc": { "comments.$.rating" : -1 } });
	}
	else if(type == 'comment'){
		var cmt = {"desc":comment, "date": new Date(), "rating": 0};
		cmt.user = Meteor.userId();
		cmt.uName = Meteor.user().username;
		cmt.id = ufb.commentCount + 1;
		UserFeedback.update({_id: topicId},{"$push":{"comments": cmt}, "$set":{ commentCount: cmt.id}}); 
	}
	else if(type == 'status'){
		UserFeedback.update({'_id': topicId},{"$set":{"status": comment}}); 		
	}
    return UserFeedback.findOne({'_id' : topicId});
  }

});