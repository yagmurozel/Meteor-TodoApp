
if(Meteor.isClient){


Template.lists.onCreated(function () {
  this.subscribe('lists');
});



$.validator.setDefaults({
  rules: {
	email: {
	  required: true,
	  email: true
	},
	password: {
	  required: true,
	  minlength: 6
	}
  },
  messages: {
	email: {
	  required: "You must enter an email address.",
	  email: "You've entered an invalid email address."
    },
	password: {
	  required: "You must enter a password.",
	  minlength: "Your password must be at least {0} characters."
	}
  }
});


Template.login.onCreated(function(){
	console.log("The 'login' template was just created.");
});


Template.login.onRendered(function(){
  var validator = $('.login').validate({
	submitHandler: function(event){
      var email = $('[name=email]').val();
	  var password = $('[name=password]').val(); 
	  Meteor.loginWithPassword(email, password, function(error){
		if(error){
		  if(error.reason == "User not found"){
			validator.showErrors({
			  email: "That email doesn't belong to a registered user."
			}); 
		  }
		  if(error.reason == "Incorrect password"){ validator.showErrors({
			password: "You entered an incorrect password."
		  });
		  } 
   		} else {
			var currentRoute = Router.current().route.getName(); 
			if(currentRoute == "login"){
				Router.go("home");
			}
		  } 
		});
	} 
  });
});



Template.login.onDestroyed(function(){
	console.log("The 'login' template was just destroyed.");
});


Template.register.onRendered(function(){
  var validator = $('.register').validate({
	submitHandler: function(event){
	  var email = $('[name=email]').val();
	  var password = $('[name=password]').val(); Accounts.createUser({
		email: email,
		password: password 
		}, function(error){
	      if(error){ 	
		    if(error){
		      if(error.reason == "Email already exists."){
			    validator.showErrors({
			    email: "That email already belongs to a registered user."
			  });
		  }
		}		
	    } else { 
			Router.go("home");
		  } 
		});
	}
  });
});




// Helpers
Template.todos.helpers({
	'todo': function(){
	  var currentList = this._id;
	  var currentUser = Meteor.userId();
		return Todos.find({ listId: currentList, createdBy: currentUser }, {sort: {createdAt: -1}})
	}
});


Template.todoItem.helpers({
	'checked': function(){
	  var isCompleted = this.completed;
	  if(isCompleted){
		return "checked";
	  } else {
		 return "";
		}
	}
});


Template.todosCount.helpers({
	'totalTodos': function(){
		var currentList = this._id;
		return Todos.find({ listId: currentList }).count();
	},
	'completedTodos': function(){
		var currentList = this._id;
		return Todos.find({ listId: currentList, completed: true }).count();
	}
});


Template.lists.helpers({
	'list': function(){
		var currentUser = Meteor.userId();
		return Lists.find({ createdBy: currentUser }, {sort: {name: 1}})
	} 
});


Template.home.helpers({
	'loggedUser': function(){
		var loggedUser = Meteor.user();
		return loggedUser.emails[0].address;
	}
});




//Events
Template.addTodo.events({
    'submit form': function(event){
	  event.preventDefault();
	  var todoName = $('[name="todoName"]').val();
	  var currentUser = Meteor.userId();
	  var currentList = this._id;
	  Meteor.call('createListItem', todoName, currentList, function(error){
		if(error){ 
			console.log(error.reason);
		} else { 
			$('[name="todoName"]').val('');
	    }
	 });	
	}
});


Template.todoItem.events({
    'click .delete-todo': function(event){ 
    	event.preventDefault();
    	var documentId = this._id;
    	var confirm = window.confirm("Delete this task?"); if(confirm){
    	Meteor.call('removeListItem', documentId);
    }
},

    'keyup [name=todoItem]': function(event){
	  if(event.which == 13 || event.which == 27){
		$(event.target).blur();
	} else {
		var documentId = this._id;
		var todoItem = $(event.target).val();
		Meteor.call('updateListItem', documentId, todoItem);
	}
},

    'change [type=checkbox]': function(){ 
	  var documentId = this._id;
	  var isCompleted = this.completed; 
	  if(isCompleted){
		Meteor.call('changeItemStatus', documentId, false); 
	} else {
		Meteor.call('changeItemStatus', documentId, true); 
	}
}

});




Template.addList.events({
	'submit form': function(event){
		event.preventDefault();
		var listName = $('[name=listName]').val();
		Meteor.call('createNewList', listName, function(error, results){
		if(error) { 
			console.log(error.reason);
		} else { 
			Router.go('listPage', { _id: results });
			$('[name=listName]').val('');
		}
		});
	}
});



Template.register.events({
	'submit form': function(event){
			event.preventDefault();
	}	
});


Template.register.onRendered(function(){
	$('.register').validate();
});
		

Template.navigation.events({
	'click .logout': function(event){
		event.preventDefault();
		Meteor.logout();
		Router.go('login');
	}
});


Template.login.events({
	'submit form': function(event){
		event.preventDefault();
	}
});


Template.lists.events({
	'click .delete-list': function(event){ 
    	event.preventDefault();
    	var documentId = this._id;
    	var confirm = window.confirm("Delete this list?"); if(confirm){
    	    Meteor.call('removeList', documentId);
    	}
	}
});


}




Todos = new Meteor.Collection('todos');

Lists = new Meteor.Collection('lists');

Router.configure({
  layoutTemplate: 'main',
  loadingTemplate: 'loading'
});

Router.route('/register');

Router.route('/login');

Router.route('/', {
    name: 'home',
    template: 'home' 
});

Router.route('/list/:_id', { 
	name: 'listPage', 
	template: 'listPage', 
	data: function(){
		var currentList = this.params._id;
		var currentUser = Meteor.userId();
		return Lists.findOne({ _id: currentList, createdBy: currentUser });
	},

	onBeforeAction: function(){
		var currentUser = Meteor.userId(); if(currentUser){
		this.next(); } else {
		this.render("login"); }
	},
	waitOn: function(){
		var currentList = this.params._id;
		return Meteor.subscribe('todos', currentList);
	}
});		
		