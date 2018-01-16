const smsMenu = require('../lib.js');

smsMenu.on('session', function(session) {
	var user_start_message = session.lastMessage;

	// set session config
	session.case_sensitive = true;
	session.auto_trim = true;
	session.timeOut = 60*5; // 5 minutes

	// Welcome message
	session.send("Welcome to Bank!\n1- Check funds\n2- Transfer");

	var mainMenu = session.on('received', function(session) {
		if(session.lastMessage=='1') {
			session.send("Check funds from:\n1- Default\n2- Savings");
			session.on('received', function(session) {
				session
					.send("Your account "+session.lastMessage+" is worth US$ 7,425.89\n1- Check funds\n2- Transfer")
					.returnTo(mainMenu);
			});
		}
		else if(session.lastMessage=='2') {
			session.send("What's the destination account?");
			var transferMenu = session.on('received', function(session) {
				var destination_account = session.lastMessage;

				// shortcut to received event is:
				session.send("What's the amount?", function(session) {
					var amount = session.lastMessage;
					console.log("User wants to send "+amount+" to "+destination_account);

					session.send("Amount sent! What do you want to do now?\n1- Make another transfer\n2- Back to menu\n3- Close");

					session.on('received', function(session) {
						switch (session.lastMessage) {
							case '1':
								session.send("What's the destination account?");
								session.returnTo(transferMenu);
								break;
							case '2':
								session.send("1- Check funds from another account\n2- Transfer");
								session.returnTo(mainMenu);
								break;
							case '3':
								session.send("Bye!");
								session.close();
								break;
							default:
								session.send("Unrecognized command!");
						}
						
					});

				});
			});
		} else {
			session.send("Unrecognized command!");
		}
	});

	session.on('timeout', function(session) {
		console.log("Session with "+session.phoneNumber+" closed due to inactivity");
	})
}).start(); // replace .start() with .debug() if you want to simulate SMS sending-receiving on your terminal




