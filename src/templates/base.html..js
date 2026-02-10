// src/templates/base.html.js
module.exports = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>{styles}</style>
</head>
<body>
    <div class="container">
        {content}
    </div>
    <script>{scripts}</script>
</body>
</html>
`;

