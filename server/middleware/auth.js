function isLoggedIn(req, res, next) {
    if(!(req.session && req.session.passport)) {
        res.status(401).send();
    } else {
        next();
    }
}

export { isLoggedIn };
