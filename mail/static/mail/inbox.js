document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email() {
  const composeRecipients = document.querySelector('#compose-recipients');
  const composeSubject = document.querySelector('#compose-subject');
  const composeBody = document.querySelector('#compose-body');
  const submitButton = document.querySelector('#compose-submit');

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  composeRecipients.placeholder = 'To:';
  composeRecipients.value = '';
  composeSubject.placeholder = 'Subject';
  composeSubject.value = '';
  composeBody.placeholder = 'Body';
  composeBody.value = '';
  composeRecipients.disabled = false;

  // Check if all required fields are filled before submitting
  document.querySelector('form').onsubmit = () => {
    if(composeRecipients.value.length > 0){
        if(composeSubject.value.length > 0){
            if(composeBody.value.length > 0){

                // send POST request
                fetch('/emails', {
                    method: 'POST',
                    body: JSON.stringify({
                        recipients: composeRecipients.value,
                        subject: composeSubject.value,
                        body: composeBody.value,
                        read: 'false'
	                })
                })
                .then(response => {
                    if(response.ok){
                        return response.json()
                    }
                    else{
                        return response.json()
                        .then(response => {
                            throw new Error(response.error);              
						})
					}
                })
                .then(result => {
                    console.log(result.message);
                    load_mailbox('sent');
				})
                .catch(error => {
                    composeRecipients.value = '';
                    composeRecipients.placeholder = error;
                    console.log(error);
				})
	        }else{
                composeBody.placeholder = 'No message!';
			}
	    }else{
            composeSubject.placeholder = 'No subject!';
		}
	}else{
        composeRecipients.placeholder = 'Include at least one recipient!';
	}

    return false;
  }
}

function load_mailbox(mailbox) {
  const emailsView = document.querySelector('#emails-view');
  
  // Show the mailbox and hide other views
  emailsView.style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Display appropriate mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    for(const email of emails){
        const sender = email['sender'];
        const subject = email['subject'];
        const time = email['timestamp']

        //Create div for each email with sender, subject and time
        const div = document.createElement('div');
        div.style.border = 'thin solid black';
        div.style.padding = '5px';
        div.style.backgroundColor = 'white';
        div.addEventListener('click', () => load_email(email['id']));

        if(email['read'] === true){
            div.style.backgroundColor = '#BEBEBE';
		}

        const senderField = document.createElement('div');
        senderField.innerHTML = sender;
        senderField.style.fontWeight =  'bold';
        senderField.style.display = 'inline';

        const subjectField = document.createElement('div');
        subjectField.innerHTML = subject;
        subjectField.style.display = 'inline';
        subjectField.style.paddingLeft = '20px';

        const timeField = document.createElement('div');
        timeField.innerHTML = time;
        timeField.style.display = 'inline';
        timeField.style.float = 'right';
          
        div.appendChild(senderField);
        div.appendChild(subjectField);
        div.appendChild(timeField);
        emailsView.appendChild(div);
    }
  })
  
}

function load_email(email_id) {
    const emailView = document.querySelector('#email-view');
    document.querySelector('#emails-view').style.display = 'none';
    emailView.style.display = 'block';

    //Clear existing email
    while(emailView.hasChildNodes()){
        emailView.removeChild(emailView.firstChild);
	}

    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
        //Create different views to store email info
        const sender = document.createElement('div');
        const recipients = document.createElement('div');
        const subject = document.createElement('div');
        const timestamp = document.createElement('div');
        const reply = document.createElement('button');
        const archiveEmail = document.createElement('button');
        const body = document.createElement('div');

        //Set text and class for views
        sender.innerHTML = '<b>From: </b>' + email['sender'];
        recipients.innerHTML = '<b>To: </b>' + email['recipients'];
        subject.innerHTML = '<b>Subject: </b>' + email['subject'];
        timestamp.innerHTML = '<b>Timestamp: </b>' + email['timestamp'];
        reply.innerHTML = 'Reply';
        reply.className = 'btn btn-sm btn-outline-primary';
        archiveEmail.className = 'btn btn-sm btn-outline-primary';
        body.innerHTML = email['body'];

        //Archive or unarchive depending on status
        if(email['archived'] === false)
        {
            archiveEmail.innerHTML = 'Archive Email';
            archiveEmail.addEventListener('click', () => {
                fetch(`/emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: true     
			        })
                })
                .then(response => {
                    console.log('Email Archived!');
                    load_mailbox('archive');
				})
		    })
		}
        else
        {
            archiveEmail.innerHTML = 'Unarchive Email';
            archiveEmail.addEventListener('click', () => {
                fetch(`/emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: false     
			        })
                })
                .then(response => {
                    console.log('Email Unarchived!');
                    load_mailbox('inbox');
				})
		    })
		}

        //Add click function to reply button
        reply.addEventListener('click', () => reply_email(
            email['sender'], email['subject'], email['timestamp'], email['body']
        )); 

        //Add all views to parent view
        emailView.appendChild(sender);
        emailView.appendChild(recipients);
        emailView.appendChild(subject);
        emailView.appendChild(timestamp);
        emailView.appendChild(reply);
        emailView.appendChild(archiveEmail);

        //Add unread button if email is read
        if(email['read'] === true){
            const unread = document.createElement('button');
            unread.className = 'btn btn-sm btn-outline-primary';
            unread.innerHTML = 'Unread Email';
            unread.addEventListener('click', () => {
                fetch(`/emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        read: false
			        })
                })
                .then(response => {
                    console.log('Email Unread!');
                    if(email['archived'] === true){
                        load_mailbox('archive');          
					}
                    else{
                        load_mailbox('inbox');
					}
				})
		    })
            emailView.appendChild(unread);
		}

        //Finish adding the rest of the email view
        emailView.appendChild(document.createElement('hr'));
        emailView.appendChild(body);

        //Post request that email is read
        fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({
                read: true     
			})
        })
    })
}

function reply_email(recipients, subject, time, body) {
  const composeRecipients = document.querySelector('#compose-recipients');
  const composeSubject = document.querySelector('#compose-subject');
  const composeBody = document.querySelector('#compose-body');
  const submitButton = document.querySelector('#compose-submit');

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Prefill fields
  composeRecipients.value = recipients;
  composeRecipients.disabled = true;

  //Subject Text
  if(subject.substring(0,4) == 'Re: '){
      composeSubject.value = subject;
  }
  else{
      composeSubject.value = 'Re: ' + subject;
  }

  //Body Text
  let bodyText = 'On ' + time + ' ' + recipients + ' wrote:\n' + body + '\n----------\n';
  composeBody.value = bodyText;

  // Check if body has new message before submitting
  document.querySelector('form').onsubmit = () => {
    if(composeBody.value != bodyText){
        // send POST request
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: composeRecipients.value,
                subject: composeSubject.value,
                body: composeBody.value,
                read: 'false'
	        })
        })
        .then(response => {
            if(response.ok){
                return response.json()
            }
            else{
                return response.json()
                .then(response => {
                    throw new Error(response.error);              
			    })
		    }
        })
        .then(result => {
            console.log(result.message);
            load_mailbox('sent');
	    })
        .catch(error => {
            alert(error);
            console.log(error);
	    })
    }else{
        composeBody.placeholder = 'No new message!';
        alert('No new message!');
    }

    return false;
  }
}