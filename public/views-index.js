$(function() {
    // function for starting the synchrornization progress when '#sync-start' button is clicked
   $('#sync-start').click(function(e) {
       e.preventDefault();
       var $form = $('#sendspace_form');

       $.ajax({
           type: 'POST',
           url: '/synchronize',
           data: $form.serialize(),
           success: function(result) {
               console.log(result);
           }
       });
   })
});