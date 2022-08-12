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

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#compose-form').onsubmit = function() {
    if (document.querySelector('#compose-recipients').value != '' && document.querySelector('#compose-subject').value != '' && document.querySelector('#compose-body').value != '')
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
    });
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  const container = document.createElement('div');
  container.style.display = 'block'
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const element1 = document.createElement('div');
      if (email.read) {
        element1.style.backgroundColor = 'rgb(220,220,220)';
      }
      element1.style.border = '1px solid black';
      element1.style.padding = '5px';
      element1.innerHTML = `<span style="font-weight: bold;">${email.sender}</span><span style="margin-left: 10px;">${email.subject}</span><span style="float: right; color: grey;">${email.timestamp}</span>`;
      container.append(element1);
      document.querySelector('#emails-view').append(container);
      element1.addEventListener('click', function() {
        fetch(`/emails/${email.id}`)
        .then(response => response.json())
        .then(email => {
            fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              read: true
            })
          });
          const emailContainer = document.createElement('div');
          emailContainer.innerHTML = `<strong>From:</strong> ${email.sender}<br><strong>To:</strong> ${email.recipients}<br><strong>Subject:</strong> ${email.subject}<br><strong>TimeStamp:</strong> ${email.timestamp}<br><button class="btn btn-sm btn-outline-primary" id="reply">Reply</button><button class="btn btn-sm btn-outline-primary" id="archive">Archive</button><hr><p>${email.body}</p>`;
          document.querySelector('#emails-view').innerHTML = '';
          document.querySelector('#emails-view').append(emailContainer);
          
          if (mailbox === 'sent') {
            document.querySelector('#archive').style.visibility = 'hidden';
          } else if (email.archived) {
            document.querySelector('#archive').innerHTML = 'Unarchive';
          }

          document.querySelector('#archive').onclick = function() {
            let notarchived = true;
            if (document.querySelector('#archive').innerHTML === 'Unarchive') {
              notarchived = false;
            }
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: notarchived
              })
            });
            load_mailbox('inbox');
          }

          document.querySelector('#reply').onclick = function() {
            compose_email();
            if (mailbox === 'sent') {
              document.querySelector('#compose-recipients').value = `${email.recipients}`;
            } else {
              document.querySelector('#compose-recipients').value = `${email.sender}`;
            }
            
            if (email.subject.slice(0, 4) === 'Re: ') {
              document.querySelector('#compose-subject').value = `${email.subject}`;
            } else {
              document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
            }
            
            document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
          }
        });
      });
    }
  });
}