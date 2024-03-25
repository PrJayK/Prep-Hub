function isLoggedIn(req, res, next) {
    if(!(req.session && req.session.passport)) {
        res.status(401).redirect('/login');
    } else {
        next();
    }
}

module.exports = {
    isLoggedIn
}