function isLoggedIn(req, res, next) {
    if(!(req.session && req.session.passport)) {
        res.sendStatus(401);
    } else {
        next();
    }
}

module.exports = {
    isLoggedIn
}