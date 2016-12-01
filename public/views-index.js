/**
 * validates form fields
 * @return {boolean} true if everything's alright, false otherwise
 */
var validateFields = function() {
    var $user = $('#sendspace-form input[name=user');
    var $password = $('#sendspace-form input[name=password');
    var $dbaccesstoken = $('#sendspace-form input[name=dbaccesstoken');

    if (!$dbaccesstoken.val()) {
        $('#response').text('Please authenticate with dropbox.');
        return false;
    }

    if (!$user.val() || !$password.val()) {
        $('#response').text('Please give sendspace credentials.');
        return false;
    }

    return true;

}

/**
 * starts synchronization process
 * @param e event
 */
var startSync = function(e) {
    e.preventDefault();
    // only start synchronization if form fields are alright
    if (validateFields()) {

        // clear error message
        $('#response').text('');

        var $form = $('#sendspace_form');

        $.ajax({
            type: 'POST',
            url: '/synchronize',
            data: $form.serialize(),
            success: function (result) {
                console.log(result);
                $('#response').text(result);
            }
        });
    }
}

$(function() {
    // bind method to button
   $('#sync-start').click(startSync);

    // ajax-spinners
}).ajaxStart(function() {
    $('#ajax-loader').show();
    $('#blanket').show();
}).ajaxStop(function() {
    $('#ajax-loader').hide();
    $('#blanket').hide();
});