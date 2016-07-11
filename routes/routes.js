var request = require('request');

module.exports = function (app) {
	

  var isNotAuthenticated = function (req, res, next) {
    if (req.session.user==undefined) {
      next();
    }
    else {
      res.redirect('/');
    }
  };

  var authenticateUser = function (req, res, next) {
    if (req.session.user != undefined) {

        if (req.session.isUnregisteredUser) {
          res.redirect('/reset');
        } else if (req.session.isNotVerified) {
          var alert = new Object();
          alert["show"] = true;
          alert["message"] = "<div> Mohon verifikasi akun Kamu terlebih dahulu melalui email. Belum terima email? <a href='/send_verify_email'>Kirim email verifikasi</a> </div>";
          alert["style"] = "alert-warning";
          req.flash('alert', JSON.stringify(alert));

          res.redirect('/');
        } else {
          next();
        }

    }
    else {
      res.redirect('/login');
    }
  };

  var createSocialVars = function(req) {
    var socialVars = {};
    
    if (req.session.twitterAccessToken) {
      socialVars.twitter = req.session.twitterScreenName;
      socialVars.twitterPict = req.session.twitterPict;
      socialVars.twitterName = req.session.twitterName;
    }
    
    if (req.session.fbAccessToken) {
      socialVars.facebook = req.session.fbAccessToken;
      socialVars.facebookPict = req.session.fbPict;
      socialVars.facebookName = req.session.fbName;
    }

    if(req.session.instagramAccessToken) {
      socialVars.instagram = req.session.instagramUserId;
      socialVars.instagramPict = req.session.instagramPict;
      socialVars.instagramName = req.session.instagramName;
    }
    
    return socialVars;
  }


  app.get('/home', function(req, res){
    res.redirect('/');
  });

  app.get('/', function (req, res){
    var getSellerAndDiscount = function(product, cb_p) {
        app.async.parallel([
          function(callback) {
            userSellerInstance.getUserById(product.seller_id, function (err, seller) {
              product.shop_name = seller.others.shop_name;
              product.shop_permalink = seller.others.shop_permalink;
              callback();
            });
          }, function(callback) {
            discountInstance.getProductDiscount(product._id, product.category_id, product.seller_id, function(err, discount) {
              if (err) logger.error(err);
              product.discount = discount;
              callback();
            });
          }
        ], function(err, results) {
          cb_p();
        });
    };
    var getSectionProductByCategory = function(category_permalink, callback) {
      var param = {};
      //param.category = app.sanitize(req.params.category_permalink);
      param.categories = [category_permalink];
      param.sort = 'price';
      var conditions = ["Baru","Bekas"];
      var limit = 8;
      var current = 0;

      searchInstance.getProductsMultipleCategories(param.query, param.categories, param.price_min, param.price_max, param.province, param.region, conditions, param.sizes, param.colors, param.fragrances, param.flavours, param.types, param.sort, current, limit, function(err, products, qcount, qtitle, qpermalink, qminprice, qmaxprice) {
        if (err) logger.error(err);
        app.async.each(products, function(product, cb_p) {
          getSellerAndDiscount(product, cb_p);
        }, function(err) {
          // console.log('---****', products);
          callback(err, products);
        });
      });
    };
    app.async.parallel({
      nSeller: function(callback) {
        userSellerInstance.countSeller(function(err, nSeller) {
          if (err) logger.error(err);
          callback(err, nSeller);
        });
      }, 
      hasVisited: function(callback) {
        if (!req.signedCookies.hasVisited) {
          // console.log('===NOT VISITED ===');
          res.cookie("hasVisited", 1, {signed:true, maxage: 31535999999.92936});
          callback(null, false);
        } else {
          // console.log('===HAS VISITED ===', req.signedCookies.hasVisited);
          callback(null, true);
        }
      }, popularProducts: function(callback) {
        models.products.findActiveProductsSortByEditorPick(1, 8, function (err, products) {
          app.async.each(products, function(product, cb_p) {
            getSellerAndDiscount(product, cb_p);
          }, function(err) {
            callback(err, products);
          });
        });
      // }, pakaian: function(callback) {
      //   getSectionProductByCategory('pakaian', function(err, products) {
      //     callback(err, productoducts);
      //   });
      // }, sepatu: function(callback) {
      //   getSectionProductByCategory('sepatu-wanita', function(err, products) {
      //     callback(err, products);
      //   });
      // }, tasAksesoris: function(callback) {
      //   getSectionProductByCategory('aksesoris-tas', function(err, products) {
      //     callback(err, products);
      //   });
      // }, healthBeauty: function(callback) {
      //   getSectionProductByCategory('produk-kesehatan', function(err, products) {
      //     callback(err, products);
      //   });
      // }, homeLiving: function(callback) {
      //   getSectionProductByCategory('aksesoris-rumah', function(err, products) {
      //     callback(err, products);
      //   });
      // }, babyKid: function(callback) {
      //   getSectionProductByCategory('perlengkapan-bayi-anak', function(err, products) {
      //     callback(err, products);
      //   });
      // }, kuliner: function(callback) {
      //   getSectionProductByCategory('kuliner', function(err, products) {
      //     callback(err, products);
      //   });
      }
    }, function(err, results) {
        if (err) logger.error(err);
        // console.log('ip1', req.headers['x-forwarded-for']);
        // console.log('ip2', req.connection.remoteAddress);
        // console.log('ip3', req.socket.remoteAddress);
        // // console.log('ip4', req.connection.socket.remoteAddress);
        // console.log('ip5', req.ip);
        // console.log('ip6', req.ips);
        // console.log('ip7', app.requestIp.getClientIp(req));
        res.render('index.jade', results);
      });
    });

  /*--- ACCOUNT PAGES ---*/

  var loginLuar = function (req, res, email, fullname, other_id, id) {
    models.users.findByEmailInsensitive(email, function (user) {
      if (user==undefined) {
        var time = new Date();
        var emailCode = app.shortId.generate();
        user = new models.users({
          other_id: id,
          email: email,
          fullname: fullname,
          'others.email_code': emailCode,
          'others.register_time': time,
          'others.seller': true, //anyone who register will be applied as seller
          _id: new app.mongoose.Types.ObjectId()
        });

        user.save(function (err) {
          if (!err) {
            user_profile = new models.users_profiles({
              _id: user._id,
              pict: "../default.jpg"
            });
            user_profile.save(function (err) {
              if (!err) {
                console.log(user.email + " has register successfully at "+ new Date() + " through Facebook.");

                // send email user_account_activation
                var param = {};
                param.user = {};
                param.user.fullname = fullname;
                param.user.others = {};
                param.user.others.email_code = emailCode;
                param.user.others.seller = true; 
                mailerInstance.userAccountActivation(email, param);
                user.allowedToPostProduct = false;
                saveSession(req, res, user, function() {
                  app.shortRedirect(res, req.signedCookies.redir_url);
                });

                // app.mailer.send('mail/register', {
                //   to: email,
                //   subject: 'Selamat bergabung di Kleora',
                //   activationUrl: app.host+"/verify_email?code="+emailCode
                // }, function (err) {
                //   if (err) {
                //     console.log(err);
                //     res.render("helpers/500.jade");
                //   }
                //   else {
                //     saveSession(req, res, user, function() {
                //       app.shortRedirect(res, req.signedCookies.redir_url);
                //     });
                //   }
                // });
              } else {
                console.log(err);
                res.render("helpers/500.jade");
              }
            });
          } else {
            console.log(err);
            res.render("helpers/500.jade");
          }
        });
      }
      else
      {
        models.users_profiles.findById(user._id, function(err, profile) {
          user.allowedToPostProduct = (profile.region_id && profile.phone) ? true : false;
          saveSession(req, res, user, function() {
            app.shortRedirect(res, req.signedCookies.redir_url);
          });
        });
      }
    });
  };

  app.get('/login', isNotAuthenticated, function (req, res) {
    res.render('account/login.jade');
  });

  app.get('/verify_email',  function (req, res) {
    var code = app.sanitize(req.param('code'));
    models.users.findOne({'others.email_code': code}, function (err, user) {
      if (user!=undefined)
      {
        user.others.email_verified = true;
        user.others.email_code = undefined;
        user.save();

        req.session.isNotVerified = false;
        req.session.save();

        // send email user_welcome
        var param = {};
        param.user = {};
        param.user.fullname = user.fullname;
        mailerInstance.userWelcome(user.email, param);

        // var alert = new Object();
        // alert["show"] = true;
        // alert["message"] = "<div>Akun Kleora Kamu telah berhasil diaktifkan.</div>";
        // alert["style"] = "alert-success";
        // req.flash('alert', JSON.stringify(alert));


        res.render('account/activated.jade',{
          user: user
        });
      } else {
        res.render('helpers/404-verifyemail.jade', {
          verifyEmail : true
        });
      }
    });
  });

  app.post('/verify_phone', function(req, res) {
    var userId = app.sanitize(req.param('userId'));
    var phone = app.sanitize(req.param('phone'));

    userSellerInstance.sendPhoneVerification(userId, phone, function(err, success) {
      if (err) logger.error(err);
      var result = {};
      if (success) {
        result["success"] = true;
      } else {
        result["success"] = false;
      }
      res.json(result);
    });

  });

  app.get('/forgot', function (req, res) {
    res.render('account/forgot.jade'); 
  });

  app.get('/reset', function (req, res) {
    var code = "";
    if (!req.session.isUnregisteredUser) {
      code = app.sanitize(req.param('code'));
      models.users.findOne({'others.reset_code': code}, function (err, user) {
        if (user!=undefined)
        {
          res.render('account/reset.jade', {
            code: code
          });
        } else {
          res.render('helpers/404.jade');
        }
      });
    } else {
      res.render('account/reset.jade');
    }
  });

  app.post('/login', isNotAuthenticated, function (req, res) {

    var email = app.sanitize(req.param('email')).toLowerCase();
    var password = app.sanitize(req.param('password'));
    var rememberMe = app.sanitize(req.param('rememberMe'));
    var checkoutTransactionId = app.sanitize(req.param('checkout_transaction_id'));
    var prev_url = req.header('Referer');
    
    var hour = 3600000;

    var analyticsParam = {};
    analyticsParam.user_id = '';
    analyticsParam.user_type = 'buyer';
    analyticsParam.login_type = 'dashboard';
    analyticsParam.login_time = '';

    if ((rememberMe!=undefined) && (rememberMe)) {
      req.session.cookie.maxAge = 14 * 24 * hour; //2 weeks
    } else {
      req.session.cookie.maxAge = 3 * hour; // 3 hour 
    }

    var result = new Object();
    if ((email!="")&&(password!="")) {
      models.users.findByEmailInsensitive(email, function (err, user) {
        if (user!=undefined) {
          if (app.passwordHash.verify(password, user.password))
          {
            var now = new Date();
            user.others.last_login = now;
            analyticsParam.login_time = now;
            analyticsParam.user_id = user._id;
            if (user.others && user.others.shop_name) {
              analyticsParam.user_type = 'seller';
            } 
            user.save(function(err) {
              console.log(user.others.last_login);
              console.log('last login SAVED');

              if (!user.others.email_verified) {
                req.session.isNotVerified = true;
                req.session.save();
              }
            
              app.async.parallel([
                function(callback) {
                  // check if user can post product , save session
                  models.users_profiles.findById(user._id, function(err, profile) {
                    // console.log(profile);
                    user.allowedToPostProduct = (profile.region_id && profile.phone) ? true : false;
                    // console.log(user.allowedToPostProduct);
                    saveSession(req, res, user, function () {
                      callback(err);
                    });
                  });

                }, function(callback) {
                  // check transaction not checkout  - for notif
                  models.transactions.findByUserIdAndNotCheckout(user._id, function(err, transaction) {
                    if (transaction) {
                      // models.transactions_products.findByTransactionId(transaction._id, false, function(tps) {
                      transactionInstance.countNProductsByTransactionId(transaction._id, function(err, totalProducts) {
                        // console.log('==== Number of Item in Cart ====');
                        // console.log(tps.length);
                        // set n cart item - for notification
                        // console.log(tps);
                        // console.log(tps.length);
                        res.cookie("n_cart_item", totalProducts, {signed:true, maxage: 31535999999.92936});
                        // console.log('==== COOKIES ======');
                        // console.log(req.cookies);
                        // console.log('==== COOKIES ======');
                        // console.log('--N CART ITEM in cookies --' + res.cookies.n_cart_item);
                        // res.cookie("n_cart_item", tps.length, {signed:true, maxage: 31535999999.92936});
                        // console.log('==== Number of Item in Cart ====');
                        callback(null);
                      });
                    } else {
                        res.cookie("n_cart_item", 0, {signed:true, maxage: 31535999999.92936});
                        // console.log('==== COOKIES ======');
                        // console.log(req.cookies);
                        // console.log('==== COOKIES ======');
                        // console.log('--N CART ITEM in cookies --' + res.cookies.n_cart_item);
                        // res.cookie("n_cart_item", 0, {signed:true, maxage: 31535999999.92936});
                        // console.log('==== Number of Item in Cart ====');
                        callback(null);
                    }
                  });
                }, function(callback) {
                  // update user_id in transaction_id if called from checkout page
                  if (checkoutTransactionId) {
                    result["redir_url"] = "/checkout?transaction_id=" + checkoutTransactionId;
                    analyticsParam.login_type = 'checkout';
                    transactionInstance.updateUserIdByTransactionId(checkoutTransactionId, user._id, function(err) {
                      if (err) console.log(err);
                      callback(null);
                    });
                  } else {
                    if (prev_url && (prev_url.indexOf('verify_email') == -1)) {
                      result["redir_url"] = prev_url;  
                    } else {
                      result["redir_url"] = req.signedCookies.redir_url;
                    }
                    callback(null);
                  }
                }, function(callback){
                  //getting facebook profile
                  if(user.others.fbAccessToken !== undefined && user.others.fbAccessToken !== null){
                    console.log('===========GETTING FB PROFILE');
                    request.get({url: 'https://graph.facebook.com/v2.2/me?access_token=' + user.others.fbAccessToken}, function(err, result, body){
                      if(err){
                        logger.error(err);
                        callback();
                      }else{
                        var body = JSON.parse(body);
                        console.log(body);
                        req.session.fbName = body.name;
                        req.session.fbUserId = body.id;
                        req.session.fbAccessToken = user.others.fbAccessToken;
                        req.session.save(function(err){});
                        callback();
                      }
                    });
                  }else{
                    callback();
                  }
                }, function(callback){
                  //getting facebook photos
                  if(user.others.fbAccessToken !== undefined && user.others.fbAccessToken !== null){
                    console.log('===========GETTING FB PHOTO');
                    request.get({url: 'https://graph.facebook.com/v2.2/me/picture?access_token=' + user.others.fbAccessToken + '&redirect=false'}, function(err, result, body){
                      if(err){
                        logger.error(err);
                        callback();
                      }else{
                        var body = JSON.parse(body);
                        req.session.fbPict = body.data.url;
                        req.session.save(function(err){});
                        callback();
                      }
                    });
                  }else{
                    callback();
                  }
                }, function(callback){
                  //getting twitter profile
                  if(user.others.twitterAccessToken !== undefined && user.others.twitterTokenSecret !== undefined && user.others.twitterAccessToken !== null && user.others.twitterTokenSecret !== null){
                    console.log('===========GETTING TWITTER PROFILE');
                    var auth = { 
                      consumer_key: app.twitter_consumer_key,
                      consumer_secret: app.twitter_consumer_secret,
                      token: user.others.twitterAccessToken,
                      token_secret: user.others.twitterTokenSecret
                    };

                    request.get({
                      url: "https://api.twitter.com/1.1/users/show.json?screen_name=" + user.others.twitterID,
                      oauth: auth
                    }, function(err,result,body){
                      if(err){
                        logger.error(err);
                        callback();
                      }else{
                        var body = JSON.parse(body);
                        req.session.twitterAccessToken = user.others.twitterAccessToken;
                        req.session.twitterTokenSecret = user.others.twitterTokenSecret;
                        req.session.twitterPict = body.profile_image_url;
                        req.session.twitterName = body.name;
                        req.session.twitterUserId = body.id;
                        req.session.twitterScreenName = user.others.twitterID;
                        req.session.save(function(err){});
                        callback();
                      }
                    });
                  }else{
                    callback();
                  }
                }, function(callback){
                  //getting instagram profile
                  if(user.others.instagramAccessToken !== undefined && user.others.instagramAccessToken !== null){
                    console.log('===========GETTING INSTAGRAM PROFILE');
                    var ig = require('instagram-node').instagram();
                    ig.use({
                      access_token: user.others.instagramAccessToken
                    });
                    ig.user(user.others.instagramID, function(err, result, remaining, limit){
                      if(err){
                        logger.error(err);
                        callback();
                      }else{
                        req.session.instagramAccessToken = user.others.instagramAccessToken;
                        req.session.instagramUserId = result.username;
                        req.session.instagramRealId = user.others.instagramID;
                        req.session.instagramPict = result.profile_picture;
                        req.session.instagramName = result.full_name;
                        callback();
                      }
                    });
                  }else{
                    callback();
                  }
                }
              ], function(err) {
                // send result
                // console.log(req.session);
                if (err) logger.error(err);
                analyticsInstance.saveLoginUser(analyticsParam.user_id, analyticsParam.user_type, analyticsParam.login_type, analyticsParam.login_time, function(err, userLogin) {
                  if (err) logger.error(err);
                  result["success"] = true;
                  result["email"] = email;
                  result["is_seller"] = user.others.seller;
                  result["shop_name"] = user.others.shop_name;
                  res.json(result);
                });
              })
            });
          }
          else {
            if (!user.isUnregistered) {
              result["success"] = false;
              result["error.password"] = "Password salah.";
              res.json(result);
            } else {
              result["success"] = false;
              result["error.password"] = "Email terdaftar sebagai buyer.<br/> <a href='/forgot'>Set password</a> untuk login.";
              res.json(result);
            }
          }
        }
        else {
          result["success"] = false;
          result["error.email"] = "Pengguna dengan email "+email+" tidak ditemukan.";
          res.json(result);
        }
      });
    } else {
      result["success"] = false;
      if (email=="")
        result["error.email"] = "Alamat email tidak boleh kosong.";
      if (password=="")
        result["error.password"] = "Password tidak boleh kosong.";
      res.json(result);
    }
  });

  app.post('/register-buyer', isNotAuthenticated, function (req, res) {
    var redir_url = app.sanitize(req.param('redirect_url')) || '/';
    userSellerInstance.registerBuyer(app.sanitize(req.param('email')), function(err, newUser) {
      if (err) {
        // logger.error(err);
        var alert = new Object();
        alert["show"] = true;
        alert["message"] = "<div>Email "+newUser.email+" sudah pernah didaftarkan.</div>";
        alert["style"] = "alert-warning";
        req.flash('alert', JSON.stringify(alert));
        res.redirect(redir_url);
      } else {
        var alert = new Object();
        alert["show"] = true;
        alert["message"] = "<div>Email kamu telah sukses tersimpan.</div>";
        alert["style"] = "alert-success";
        req.flash('alert', JSON.stringify(alert));
        res.redirect(redir_url);
      }
    });
  });

  app.post('/register-buyer-name-email-phone', isNotAuthenticated, function (req, res) {
    var redir_url = app.sanitize(req.param('redirect_url')) || '/';
    userSellerInstance.registerBuyerNameEmailPhone(app.sanitize(req.param('email')), app.sanitize(req.param('name')), app.sanitize(req.param('handphone')), function(err, newUser) {
      if (err) {
        // logger.error(err);
        var alert = new Object();
        alert["show"] = true;
        alert["message"] = "<div>Email "+newUser.email+" sudah pernah didaftarkan.</div>";
        alert["style"] = "alert-warning";
        req.flash('alert', JSON.stringify(alert));
        res.redirect(redir_url);
      } else {
        var alert = new Object();
        alert["show"] = true;
        alert["message"] = "<div>Email kamu telah sukses tersimpan.</div>";
        alert["style"] = "alert-success";
        req.flash('alert', JSON.stringify(alert));
        res.redirect(redir_url);
      }
    });
  });


  app.post('/register', isNotAuthenticated, function (req, res) {
      var fullname = app.sanitize(req.param('fullname')),
          email = app.sanitize(req.param('email')).toLowerCase(),
          password = app.sanitize(req.param('password')),
          confirm_password = app.sanitize(req.param('confirm-password')),
          accept = app.sanitize(req.param('accept')),
          result = new Object();

      if (fullname.length < 2 || fullname.length > 60) {
          result["success"] = false;
          result["error.fullname"] = "Nama Lengkap " + (fullname.length < 2 ? "minimal terdiri dari 2 karakter." : "terlalu panjang");
          res.json(result);

      } else if (!(/\S+@\S+\.\S+/).test(email)) {
          result["success"] = false;
          result["error.email"] = "Alamat Email tidak valid. Contoh: support@kleora.com."
          res.json(result);

      // } else if (password.length < 6) {
      //     result["success"] = false;
      //     result["error.password"] = "Password minimal terdiri dari 6 karakter.";
      //     res.json(result);

      // } else if (confirm_password.length < 6) {
      //     result["success"] = false;
      //     result["error.password_confirm"] = "Konfirmasi Password minimal terdiri dari 6 karakter.";
      //     res.json(result);

      } else if (password !== confirm_password) {
          result["success"] = false;
          result["error.password_not_equal"] = "Password dan Konfirmasi Password tidak sama.";
          res.json(result);

      } else if (accept !== 'on') {
          result["success"] = false;
          result["error"] = "Syarat dan ketentuan harus disetujui.";
          res.json(result);

      } else {
          userSellerInstance.getUserByEmail(email, function (err, user) {
              if (err) {
                  result["success"] = false;
                  result["error"] = "Ada masalah dengan sistem.";
                  res.json(result);

              } else if (user && !user.isUnregistered) {
                  result["success"] = false;
                  result["error.email"] = "Alamat email " + email + " sudah digunakan. <a href='/forgot'>Lupa password?</a>";
                  res.json(result);

              } else {
                  // register new seller
                  userSellerInstance.registerSeller(fullname, email, password, function (err, user, user_profile) {
                      if (err) {
                          result["success"] = false;
                          result["error"] = "Ada masalah dengan sistem.";
                          res.json(result);

                      } else {
                          // register success
                          console.log(email + " has successfully registered at "+ new Date() + " from " + req.ip);

                          // ++++++++++++++++++++++++++++++++++++++
                          // create simple permalink
                          // untuk uji coba
                          // var temp = user.others.shop_permalink.replace('-s-shop','');
                          var temp = user.others.shop_permalink;
                          var simple_permalink = temp;
                          var temp_simple_permalink = simple_permalink;
                          var counter = 0;
                          var do_while_loop = function() {
                            models.permalinks.findByPermalinkGroup(simple_permalink, function(err, kleora_permalink){
                              if (kleora_permalink) {
                                counter++;
                                simple_permalink = temp_simple_permalink + counter;
                              }
                              models.users.existSimplePermalink(simple_permalink, function(err, exist){
                                if (err) logger.error(err);
                                if (exist) {
                                  counter++;
                                  simple_permalink = temp_simple_permalink + counter;
                                  do_while_loop();
                                } else {
                                  console.log(simple_permalink);
                                  models.users.updateSimplePermalink(user._id, simple_permalink, function(err, sp){
                                    if (err) logger.error(err);

                                    // send email user_account_activation
                                    mailerInstance.userAccountActivation(email, {
                                        user: {
                                            fullname: fullname,
                                            others: {
                                                email_code: user.others.email_code,
                                                seller: true
                                            }
                                        }
                                    });

                                    req.flash('alert', JSON.stringify({
                                        show: true,
                                        message: "<div>Pendaftaran sukses. Mohon periksa email Kamu (termasuk folder SPAM) untuk verifikasi akun</div>",
                                        style: "alert-success"
                                    }));

                                    result["success"] = true;
                                    result["id"] = user._id;
                                    res.json(result);
                                    
                                  });
                                }
                              });
                            })
                          }
                          do_while_loop();
                          // ++++++++++++++++++++++++++++++++++++++

                          // // send email user_account_activation
                          // mailerInstance.userAccountActivation(email, {
                          //     user: {
                          //         fullname: fullname,
                          //         others: {
                          //             email_code: user.others.email_code,
                          //             seller: true
                          //         }
                          //     }
                          // });

                          // req.flash('alert', JSON.stringify({
                          //     show: true,
                          //     message: "<div>Pendaftaran sukses. Mohon periksa email Kamu (termasuk folder SPAM) untuk verifikasi akun</div>",
                          //     style: "alert-success"
                          // }));

                          // result["success"] = true;
                          // result["id"] = user._id;
                          // res.json(result);
                      }
                  });
              }
          });
      }
  });

  app.post('/forgot', function (req, res) {
    var email = app.sanitize(req.param('email'));
    models.users.findByEmailInsensitive(email, function (err, user) {
      if (user != undefined) {
        var code = app.shortId.generate();
        user.others.reset_code = code;
        user.save();

        // send email user_reset_password
        var param = {};
        param.user = {};
        param.user.fullname = user.fullname;
        param.user.others = {};
        param.user.others.reset_code = code;
        mailerInstance.userResetPassword(email, param);

        console.log(user.email + " requested reset password at "+ new Date() + ".");
        res.render('helpers/message.jade', {
          title: "Reset Password",
          message: "Sebuah email untuk reset password sudah dikirim ke email " + email + "."
        });
        // app.mailer.send('mail/reset', {
        //   to: email,
        //   subject: 'Reset Password',
        //   resetUrl: app.host+"/reset?code="+code
        // }, function (err) {
        //   if (err) {
        //     console.log(err);
        //     res.render('helpers/500.jade');
        //   }
        //   else {
          // }
        // });
      } else {
        res.render('helpers/message.jade', {
          title: "Reset Password",
          message: "Email " + email + " tidak terdaftar."
        });
      }
    });
  });

  app.get('/send_verify_email', function(req, res) {
    models.users.findById(req.session.user, function(err, user) {
      var param = {};
      param.user = {};
      param.user.fullname = user.fullname;
      param.user.others = {};
      param.user.others.email_code = user.others.email_code;
      mailerInstance.userAccountActivation(user.email, param);

      var alert = new Object();
      alert["show"] = true;
      alert["message"] = "<div> Mohon periksa email Kamu untuk verifikasi akun</div>";
      alert["style"] = "alert-success";
      req.flash('alert', JSON.stringify(alert));
      res.redirect('/');
    });
  });

  app.post('/reset', function (req, res) {
    var code = "";
    var wasUnregistered;
    var password = app.sanitize(req.param('password'));
    var confirmPassword = app.sanitize(req.param('confirm-password'));

    if (!req.session.isUnregisteredUser) {
      code = app.sanitize(req.param('code'));
      models.users.findOne({'others.reset_code': code}, function (err, user) {
        if (user!=undefined)
        {
          if (password==confirmPassword) {
            password = app.passwordHash.generate(password);
            user.password = password;
            user.others.reset_code = undefined;
            if (user.isUnregistered) {
              wasUnregistered = true;
              user.isUnregistered = false;
              user.others.email_verified = true;
              // user.others.email_code = undefined;
              // user.others.email_code = app.shortId.generate();
            }
            user.save(function (err) {
              if (!err) {

                if (wasUnregistered) {
                  // var param = {};
                  // param.user = {};
                  // param.user.fullname = user.fullname;
                  // param.user.others = {};
                  // param.user.others.email_code = user.others.email_code;
                  // mailerInstance.userAccountActivation(user.email, param);

                  user_profile = new models.users_profiles({
                    _id: user._id,
                    pict: "../default.jpg"
                  });
                  user_profile.save(function (err,userProfile) {
                    var param = {};
                    param.user = {};
                    param.user.fullname = user.fullname;
                    mailerInstance.userWelcome(user.email, param);

                    var alert = new Object();
                    alert["show"] = true;
                    alert["message"] = "<div> Password telah berhasil disimpan dan akun telah diverifikasi. Silakan login untuk melanjutkan.</div>";
                    alert["style"] = "alert-success";
                    req.flash('alert', JSON.stringify(alert));
                    res.redirect('/');
                  });

                } else {
                  var alert = new Object();
                  alert["show"] = true;
                  alert["message"] = "<div> Password telah berhasil di-reset.</div>";
                  alert["style"] = "alert-success";
                  req.flash('alert', JSON.stringify(alert));
                  res.redirect('/');
                }
              } else {
                res.render('helpers/500.jade');
              }
            });
          } else {
            res.render('helpers/message.jade', {
              title: "Reset Password",
              message: "Password dan konfirmasi password tidak sama."
            });
          }
        } else {
          res.render('helpers/404.jade');
        }
      });
    } else {
      // unregistered user try to enter dashboard
      // console.log(req.session.user);
      models.users.findById(req.session.user, function (err, user) {
        if (user!=undefined)
        {
          if (password==confirmPassword) {
            password = app.passwordHash.generate(password);
            user.password = password;
            user.isUnregistered = false;
            user.others.email_verified = true;

            // user.others.email_code = app.shortId.generate();
            // console.log(user);
            user.save(function (err, userSaved) {
              if (!err) {
                // console.log(userSaved);

                user_profile = new models.users_profiles({
                  _id: user._id,
                  pict: "../default.jpg"
                });
                user_profile.save(function (err,userProfile) {

                  // var param = {};
                  // param.user = {};
                  // param.user.fullname = user.fullname;
                  // param.user.others = {};
                  // param.user.others.email_code = user.others.email_code;
                  // mailerInstance.userAccountActivation(user.email, param);

                  var param = {};
                  param.user = {};
                  param.user.fullname = user.fullname;
                  mailerInstance.userWelcome(user.email, param);

                  req.session.isUnregisteredUser = false;
                  req.session.isNotVerified = false;
                  req.session.save();

                  var alert = new Object();
                  alert["show"] = true;
                  alert["message"] = "<div> Password Kamu telah berhasil disimpan dan akun telah diverifikasi.</div>";
                  alert["style"] = "alert-success";
                  req.flash('alert', JSON.stringify(alert));


                  res.redirect('/dashboard/');
                });
              } else {
                res.render('helpers/500.jade');
              }
            });
          } else {
            res.render('helpers/message.jade', {
              title: "Reset Password",
              message: "Password dan konfirmasi password tidak sama."
            });
          }
        } else {
          res.render('helpers/404.jade');
        }
      });
    }
    
  });

  app.get('/logout', function (req, res) {
    // destory session
    var email = req.session.user.email;
    req.session.destroy();
    // console.log('-- in logout');
    // console.log(req.session);
    // console.log('-- in logout');

    // erase cart item
    var ncart = req.signedCookies.n_cart_item;
    if (ncart) {
      res.cookie("n_cart_item", 0, {signed:true, maxage: 31535999999.92936});
    }
    res.redirect('/');
  });

  app.post('/android/subscribe', function (req, res) {
      var phone_number = app.sanitize(req.param('phone'));
      var email = app.sanitize(req.param('email'));
      var successEmail= false;
      var successSms = false;

      console.log("phone_number " + phone_number);
      console.log("email " + email);


      app.async.parallel([
        function(callback) {
          if (email) {
            if (!(/\S+@\S+\.\S+/).test(email)) {
              successEmail = false;
              callback();
            } else {
              mailerInstance.mobileAppDownloadLink(email, function(err) {
                if (err) {
                  logger.error(err);
                  successEmail = false;
                  callback();  
                } else {
                  userInstance.registerEmail(email, function(err, user) {
                    if (err) {
                      logger.error('erorr registerEmail ' + err);
                      successEmail = false;
                      callback();  
                    } else {
                      successEmail = true;
                      callback();
                    }
                  });
                }
              });
            }
          } else {
            callback();
          }
        }, function(callback) {
          if (phone_number) {
            smsInstance.mobileAppDownloadLink(phone_number, function (err, success) {
              console.log('err sms' + err + ' succes' + success);
              if (err || !success) {
                successSms = false;
                callback();
              } else {
                successSms = true;
                callback();
              }
            });
          } else {
            callback();
          }          
        }
      ], function(err, results) {
        console.log("successEMail " + successEmail + " successSms " + successSms);
        if (successEmail && successSms) {
          var ret = {};
          ret.success = true;
          ret.message = "Link download berhasil dikirim via sms dan email. Mohon tunggu";
          res.json(ret);
        } else if (successEmail && !successSms) {
          var ret = {};
          ret.success = true;
          ret.message = "Link download berhasil dikirim via email.";
          res.json(ret);
        } else if (!successEmail && successSms) {
          var ret = {};
          ret.success = true;
          ret.message = "Link download berhasil dikirim via sms. Mohon tunggu";
          res.json(ret);
        } else { //both success == false
          var ret = {};
          ret.success = false;
          ret.message = "Link download gagal dikirim. Mohon periksa kembali alamat email / nomor telepon yang Kamu masukan.";
          res.json(ret);

        } 
      });


    }); 

  app.get('/contact', function (req,res) {
    res.render("pages/contact.jade");
  });

  app.post('/contact', function (req, res) {
    var name = app.sanitize(req.param('name'));
    var email = app.sanitize(req.param('email'));
    var content = app.sanitize(req.param('message'));


    messageInstance.newMessage(true, false, email, name, 'contact', null, content, function(err, newMessage) {
      if (err) consle.log(err);

          // send email user_success_contact
          var param = {};
          param.user = {};
          param.user.fullname = name;
          param.contact = {};
          param.contact.content = content;
          mailerInstance.userSuccessContact(email, param);


          var alert = new Object();
          alert["show"] = true;
          alert["message"] = "<div> Terima kasih, pesan Kamu sudah disampaikan ke Kleora.</div>";
          alert["style"] = "alert-success";
          req.flash('alert', JSON.stringify(alert));
          res.redirect("/");
    });
  });

  /*--- STATIC PAGES ---*/
  app.get('/about', function (req, res) {
    res.render('pages/about.jade'); 
  });

  app.get('/karir', function (req, res) {
    res.render('pages/karir.jade'); 
  });

  app.get('/syarat_ketentuan', function (req, res) {
    res.render('pages/syarat_ketentuan.jade'); 

  });

  app.get('/faq', function (req, res) {
    res.render('pages/faq.jade'); 
  });

  app.get('/buyer_benefit', function (req, res) {
    res.render('pages/buyer_benefit.jade'); 
  });

  app.get('/guide', function (req, res) {
    res.render('pages/guide.jade'); 
  });

  app.get('/buyer_guide', function (req, res) {
    res.render('pages/buyer_guide.jade'); 
  });

  app.get('/buyer_tips', function (req, res) {
    res.redirect('http://blog.kleora.com/category/buyer-tips/'); 
  });

  app.get('/jaminan_keamanan', function (req, res) {
    res.render('pages/jaminan_keamanan.jade'); 
  });

  app.get('/seller_benefit', function (req, res) {
    res.render('pages/seller_benefit.jade'); 
  });

  app.get('/seller_guide', function (req, res) {
    res.render('pages/seller_guide.jade'); 
  });

  app.get('/seller_tips', function (req, res) {
    res.redirect('http://blog.kleora.com/category/seller-tips/'); 
  });

  // app.get('/premium_seller', function (req, res) {
  //   res.render('pages/premium_seller.jade'); 
  // });

  app.get('/blog', function (req, res) {
    res.redirect('http://blog.kleora.com/'); 
  });

  app.get('/press', function (req, res) {
    res.redirect('http://blog.kleora.com/category/press-release/'); 
  });

  app.get('/android_app', function (req, res) {
    res.render('landing/real_landing_page.jade'); 
  });

	app.get('/landing_page', function (req, res) {
    	res.render('landing/landing_page.jade');
 	});

  /*--- AJAX REQUEST ---*/
  app.get('/region', function (req, res) {
    var province_id = app.sanitize(req.param('province_id'));
    models.regions.findByProvinceId(province_id, function(err, regions) {
      res.json(regions);
    });
  });

  app.get('/region_by_permalink', function (req, res) {
    var province_permalink = app.sanitize(req.param('province_permalink'));
    locationInstance.getProvinceByPermalink(province_permalink, function(err, province) {
      if (err) logger.error(err);
      models.regions.findByProvinceId(province._id, function(err, regions) {
        res.json(regions);
      });
    });
  });
  require('./api/2/routes')(app, models, controllers);
  require('./api/routes')(app, models, controllers);
  require('./admin/routes')(app, models, controllers, createSocialVars); 
  require('./dashboard/routes')(app, models, controllers, authenticateUser, createSocialVars);
  require('./category_search')(app, models, controllers, authenticateUser);
  require('./cron')(app, models, controllers);
  require('./product')(app, models, controllers, authenticateUser);
  require('./shop')(app, models, controllers, authenticateUser);
  require('./transaction')(app, models, controllers, authenticateUser);
  // require('./wishlist')(app, models, controllers, authenticateUser);
  require('./socmed')(app, models, authenticateUser);
  require('./article')(app, models, controllers, authenticateUser);
  require('./blog_competition')(app, models, authenticateUser);
  require('./promo')(app, models, controllers, authenticateUser);
  require('./develop')(app, models, controllers);
  require('./develop2')(app, models, controllers);
  require('./withdraw_kleocoin')(app, models, controllers);

  app.get("/temp/inject_deliveries", function (req, res) {
    var target_id = app.sanitize(req.param('target_id'));
    var price = app.sanitize(req.param('price'));
    var time = app.sanitize(req.param('time'));
    models.regions.findByProvinceId(target_id, function (err, regions) {
      var index = 0;
      var loop = function () {
        if (index < regions.length) {
          models.package_deliveries.findFromTo("54087faabaede1be0b000001", "53a6b9630ceb958f78000027", regions[index]._id, function(err, package_delivery) {
            if (package_delivery!=undefined) {
              package_delivery.price = price;
              package_delivery.time = time;
              package_delivery.save();
              index++;
              loop();
            } else {
              var delivery = new models.package_deliveries({
                package_id: "54087faabaede1be0b000001",
                from: "53a6b9630ceb958f78000027",
                to: regions[index]._id,
                time: time,
                price: price,
                _id: new app.mongoose.Types.ObjectId()
              });
              delivery.save();
              index++;
              loop();
            }
          });
        } else {
          res.render("helpers/500.jade");
        }
      };
      loop();
    });
  });

  app.get("/test-email", function(req, res) {
    var param = {};
    param.user = { "_id" : "5437d650f823500034000001", "__v" : 2, "email" : "fransiskapw@gmail.com", "fullname" : "Fransiska PW", "others" : { "email_verified" : true, "last_login" : "2015-03-22T23:19:52.675Z", "register_time" : "2014-10-10T12:51:28.947Z", "seller" : true, "shop_name" : "FPWH's Shop", "shop_permalink" : "fpwh-s-shop", "shipping_id" : [ "5405c038ace83c4304ec0caf", "54087faabaede1be0b000001" ], "fbID" : "10152532418312831", "twitterID" : "fransiskapw", "instagramID" : "fransiskapw" }, "password" : "sha1$536bf9a2$1$057bf68073be31058f24ea767ad12c40832910d6" };
    param.contact = param.user;
    param.contact.message = 'isi message';
    param.transaction = { "_id" : "543668b597b538dc77000009", "__v" : 1, "create_time" : "2014-10-09T10:51:33.170Z", "payment_method" : "Bank Transfer", 
    "payment_method_param" : "{\"target_bank\":\"bni\",\"source_bank\":\"BNI\",\"name\":\"PW test live\",\"nominal\":\"127818\",\"time\":\"2014-12-01T22:41:08.785Z\"}", 
    "payment_shipping_info_id" : "5437e8a6143e59fe38000019", "progress" : -1, "province_id" : "533f812d6d07364195779445", "region_id" : "53a6b9630ceb958f78000027", 
    "target_shipping_info_ids" : [ "5437e8a6143e59fe3800001a" ], 
    "total_price" : 392000, 
    "update_time" : "2014-10-11T14:00:00.595Z", "user_id" : "5437d650f823500034000001", 
    "total_price_after_product_discount" : 392000, "time_expired" : "2014-10-11T14:00:00.595Z", "time_added_to_cart" : "2014-10-09T10:51:33.170Z" };
    param.transaction_products = [
    { "_id" : "543668b597b538dc7700000a", "__v" : 0, "assurance" : false, "create_time" : "2014-10-09T10:51:33.170Z", "message" : "", "product_id" : "53ff523faee910207f00000a", 
    "progress" : 0, "quantities" : 1, "region_id" : "53a6b9630ceb958f78000027", "shipping_id" : "5405c038ace83c4304ec0caf", "shipping_time_max" : 3, "shipping_time_min" : 1, 
    "total_price" : 196000, 
    "transaction_id" : "543668b597b538dc77000009", "update_time" : "2014-10-09T10:51:33.170Z", "color" : "", "fragrance" : "", "flavour" : "", "type" : "", 
    "discount" : 20000, 
    "total_price_after_product_discount" : 176000, "time_added_to_cart" : "2014-10-09T10:51:33.170Z", 
      product: { category:{}, "_id" : "53ff523faee910207f00000a", "__v" : 0, "avgStar" : 0, "category_id" : "54da2b48b3153e3976000025", "condition" : "Baru", "create_time" : "2014-08-28T16:01:03.018Z", "description" : "Original : china\r\nBrand : Lelestyle\r\nFabric: Polyester\r\nBust : 90cm\r\nShoulder : 33cm\r\nSleeve length : 43cm\r\nCuff : 24cm\r\nLength : 50cm", "display_picts" : [ "xJkgXZioQx.jpg", "xyiPmZiiml.jpg", "lJheNZooml.jpg", "e1PvVbjiQl.jpg" ], "is_active" : true, "n_sizes" : 0, "name" : "Korean White Blazer", "origin_picts" : [ "xJkgXZioQx.jpg", "xyiPmZiiml.jpg", "lJheNZooml.jpg", "e1PvVbjiQl.jpg" ], "permalink" : "korean-white-blazer", "price" : 189000, "quantity" : 10, "seller_id" : "53fb4aac883633577300000c", "shipping_id" : [ "5405c038ace83c4304ec0caf", "54087faabaede1be0b000001" ], "total_views" : 388, "update_time" : "2015-03-18T09:46:35.123Z", "weight_estimation" : 500, "is_returnable" : false, "return_policy" : "" }, transaction: { "_id" : "543668b597b538dc77000009", "__v" : 1, "create_time" : "2014-10-09T10:51:33.170Z", "payment_method" : "Bank Transfer", "payment_method_param" : "{\"target_bank\":\"bni\",\"source_bank\":\"BNI\",\"name\":\"PW test live\",\"nominal\":\"127818\",\"time\":\"2014-12-01T22:41:08.785Z\"}", "payment_shipping_info_id" : "5437e8a6143e59fe38000019", "progress" : -1, "province_id" : "533f812d6d07364195779445", "region_id" : "53a6b9630ceb958f78000027", "target_shipping_info_ids" : [ "5437e8a6143e59fe3800001a" ], "total_price" : 392000, "update_time" : "2014-10-11T14:00:00.595Z", "user_id" : "5437d650f823500034000001", "total_price_after_product_discount" : 392000, "time_expired" : "2014-10-11T14:00:00.595Z", "time_added_to_cart" : "2014-10-09T10:51:33.170Z" }},
    { "_id" : "5437e875143e59fe38000018", "__v" : 0, "assurance" : false, "create_time" : "2014-10-10T14:08:53.858Z", "message" : "", "product_id" : "53ff523faee910207f00000a", "progress" : 0, "quantities" : 1, "region_id" : "53a6b9630ceb958f78000027", "shipping_id" : "5405c038ace83c4304ec0caf", "shipping_time_max" : 3, "shipping_time_min" : 1, "total_price" : 196000, "transaction_id" : "543668b597b538dc77000009", "update_time" : "2014-10-10T14:08:53.858Z", "color" : "", "fragrance" : "", "flavour" : "", "type" : "", 
    "discount" : 30000, 
    "total_price_after_product_discount" : 166000, "time_added_to_cart" : "2014-10-10T14:08:53.858Z", 
    product: { category:{}, "_id" : "53ff523faee910207f00000a", "__v" : 0, "avgStar" : 0, "category_id" : "54da2b48b3153e3976000025", "condition" : "Baru", "create_time" : "2014-08-28T16:01:03.018Z", "description" : "Original : china\r\nBrand : Lelestyle\r\nFabric: Polyester\r\nBust : 90cm\r\nShoulder : 33cm\r\nSleeve length : 43cm\r\nCuff : 24cm\r\nLength : 50cm", "display_picts" : [ "xJkgXZioQx.jpg", "xyiPmZiiml.jpg", "lJheNZooml.jpg", "e1PvVbjiQl.jpg" ], "is_active" : true, "n_sizes" : 0, "name" : "Korean White Blazer", "origin_picts" : [ "xJkgXZioQx.jpg", "xyiPmZiiml.jpg", "lJheNZooml.jpg", "e1PvVbjiQl.jpg" ], "permalink" : "korean-white-blazer", "price" : 189000, "quantity" : 10, "seller_id" : "53fb4aac883633577300000c", "shipping_id" : [ "5405c038ace83c4304ec0caf", "54087faabaede1be0b000001" ], "total_views" : 388, "update_time" : "2015-03-18T09:46:35.123Z", "weight_estimation" : 500, "is_returnable" : false, "return_policy" : "" }, transaction: { "_id" : "543668b597b538dc77000009", "__v" : 1, "create_time" : "2014-10-09T10:51:33.170Z", "payment_method" : "Bank Transfer", "payment_method_param" : "{\"target_bank\":\"bni\",\"source_bank\":\"BNI\",\"name\":\"PW test live\",\"nominal\":\"127818\",\"time\":\"2014-12-01T22:41:08.785Z\"}", "payment_shipping_info_id" : "5437e8a6143e59fe38000019", "progress" : -1, "province_id" : "533f812d6d07364195779445", "region_id" : "53a6b9630ceb958f78000027", "target_shipping_info_ids" : [ "5437e8a6143e59fe3800001a" ], "total_price" : 392000, "update_time" : "2014-10-11T14:00:00.595Z", "user_id" : "5437d650f823500034000001", "total_price_after_product_discount" : 392000, "time_expired" : "2014-10-11T14:00:00.595Z", "time_added_to_cart" : "2014-10-09T10:51:33.170Z" } }]
    param.transaction_product = { "_id" : "543668b597b538dc7700000a", "__v" : 0, "assurance" : false, "create_time" : "2014-10-09T10:51:33.170Z", "message" : "", "product_id" : "53ff523faee910207f00000a", "progress" : 0, "quantities" : 1, "region_id" : "53a6b9630ceb958f78000027", "shipping_id" : "5405c038ace83c4304ec0caf", "shipping_time_max" : 3, "shipping_time_min" : 1, "total_price" : 196000, "transaction_id" : "543668b597b538dc77000009", "update_time" : "2014-10-09T10:51:33.170Z", "color" : "", "fragrance" : "", "flavour" : "", "type" : "", "discount" : 20000, "total_price_after_product_discount" : 196000, "time_added_to_cart" : "2014-10-09T10:51:33.170Z", product: { category:{}, "_id" : "53ff523faee910207f00000a", "__v" : 0, "avgStar" : 0, "category_id" : "54da2b48b3153e3976000025", "condition" : "Baru", "create_time" : "2014-08-28T16:01:03.018Z", "description" : "Original : china\r\nBrand : Lelestyle\r\nFabric: Polyester\r\nBust : 90cm\r\nShoulder : 33cm\r\nSleeve length : 43cm\r\nCuff : 24cm\r\nLength : 50cm", "display_picts" : [ "xJkgXZioQx.jpg", "xyiPmZiiml.jpg", "lJheNZooml.jpg", "e1PvVbjiQl.jpg" ], "is_active" : true, "n_sizes" : 0, "name" : "Korean White Blazer", "origin_picts" : [ "xJkgXZioQx.jpg", "xyiPmZiiml.jpg", "lJheNZooml.jpg", "e1PvVbjiQl.jpg" ], "permalink" : "korean-white-blazer", "price" : 189000, "quantity" : 10, "seller_id" : "53fb4aac883633577300000c", "shipping_id" : [ "5405c038ace83c4304ec0caf", "54087faabaede1be0b000001" ], "total_views" : 388, "update_time" : "2015-03-18T09:46:35.123Z", "weight_estimation" : 500, "is_returnable" : false, "return_policy" : "" }, transaction: { "_id" : "543668b597b538dc77000009", "__v" : 1, "create_time" : "2014-10-09T10:51:33.170Z", "payment_method" : "Bank Transfer", "payment_method_param" : "{\"target_bank\":\"bni\",\"source_bank\":\"BNI\",\"name\":\"PW test live\",\"nominal\":\"127818\",\"time\":\"2014-12-01T22:41:08.785Z\"}", "payment_shipping_info_id" : "5437e8a6143e59fe38000019", "progress" : -1, "province_id" : "533f812d6d07364195779445", "region_id" : "53a6b9630ceb958f78000027", "target_shipping_info_ids" : [ "5437e8a6143e59fe3800001a" ], "total_price" : 392000, "update_time" : "2014-10-11T14:00:00.595Z", "user_id" : "5437d650f823500034000001", "total_price_after_product_discount" : 392000, "time_expired" : "2014-10-11T14:00:00.595Z", "time_added_to_cart" : "2014-10-09T10:51:33.170Z" }, shipping : 'shipping'};
    param.products = [{ "_id" : "53ff523faee910207f00000a", "__v" : 0, "avgStar" : 0, "category_id" : "54da2b48b3153e3976000025", "condition" : "Baru", "create_time" : "2014-08-28T16:01:03.018Z", "description" : "Original : china\r\nBrand : Lelestyle\r\nFabric: Polyester\r\nBust : 90cm\r\nShoulder : 33cm\r\nSleeve length : 43cm\r\nCuff : 24cm\r\nLength : 50cm", "display_picts" : [ "xJkgXZioQx.jpg", "xyiPmZiiml.jpg", "lJheNZooml.jpg", "e1PvVbjiQl.jpg" ], "is_active" : true, "n_sizes" : 0, "name" : "Korean White Blazer", "origin_picts" : [ "xJkgXZioQx.jpg", "xyiPmZiiml.jpg", "lJheNZooml.jpg", "e1PvVbjiQl.jpg" ], "permalink" : "korean-white-blazer", "price" : 189000, "quantity" : 10, "seller_id" : "53fb4aac883633577300000c", "shipping_id" : [ "5405c038ace83c4304ec0caf", "54087faabaede1be0b000001" ], "total_views" : 388, "update_time" : "2015-03-18T09:46:35.123Z", "weight_estimation" : 500, "is_returnable" : false, "return_policy" : "" }];
    param.product = { "_id" : "53ff523faee910207f00000a", "__v" : 0, "avgStar" : 0, "category_id" : "54da2b48b3153e3976000025", "condition" : "Baru", "create_time" : "2014-08-28T16:01:03.018Z", "description" : "Original : china\r\nBrand : Lelestyle\r\nFabric: Polyester\r\nBust : 90cm\r\nShoulder : 33cm\r\nSleeve length : 43cm\r\nCuff : 24cm\r\nLength : 50cm", "display_picts" : [ "xJkgXZioQx.jpg", "xyiPmZiiml.jpg", "lJheNZooml.jpg", "e1PvVbjiQl.jpg" ], "is_active" : true, "n_sizes" : 0, "name" : "Korean White Blazer", "origin_picts" : [ "xJkgXZioQx.jpg", "xyiPmZiiml.jpg", "lJheNZooml.jpg", "e1PvVbjiQl.jpg" ], "permalink" : "korean-white-blazer", "price" : 189000, "quantity" : 10, "seller_id" : "53fb4aac883633577300000c", "shipping_id" : [ "5405c038ace83c4304ec0caf", "54087faabaede1be0b000001" ], "total_views" : 388, "update_time" : "2015-03-18T09:46:35.123Z", "weight_estimation" : 500, "is_returnable" : false, "return_policy" : "" };
    param.payment = {};
    param.report = {};
    param.withdraw = {};
    param.review = {};
    param.discussion = {};
    param.kleocoin = {};
    param.transaction.verification_digit = 544;

    var host = app.host;
    var rupiah = function(number) { return app.accounting.formatNumber(number, 0, ".", ",")};
    var moment = app.moment;

    // res.render("mail/android", {param:param, host:host, rupiah:rupiah, moment:moment});
  });
  
  // ++++++++++++++++++++++++++++++++++++++
  // shop simple permalink (harus paling bawah :p)
  app.get('/:shop', function(req, res) {
    var permalink = app.sanitize(req.params.shop);
    // if (permalink.indexOf('-shop') > -1) {
      // permalink = permalink.replace('-shop','');

      var userSeller = new controllers.UserSeller;
      var transaction = new controllers.Transaction;
      var product = new controllers.Product;
      // var respon = {};
      // respon.message = req.params.shop;
      // res.json(respon);

      var seller_user = {};
      var products = [];
      models.users.findBySimplePermalink(permalink, function(err, seller){
        // var seller = users;
        // res.json(users);
        if (seller) {
          seller.others.register_time_format = app.moment(seller.others.register_time).format('DD MMMM YYYY');
          seller.others.last_login_format = app.moment(seller.others.last_login).format('DD MMMM YYYY');

          app.async.parallel([
            function(callback) {
              // get user profile & region
              models.users_profiles.findById(seller._id, function(err, user_profile) {
                seller.profile = user_profile;
                models.regions.findById(user_profile.region_id, function(err, region) {
                  if (region) {
                    seller.profile.region_name = region.name;
                    callback(null);
                  } else {
                    seller.profile.region_name = "-";
                    callback(null);
                  }
                }); 
              });
            },
            function(callback) {
              // get seller favorite
              userSeller.countFavoriteBySeller(seller._id, function(err, count_f) {
                seller.favorite = count_f;
                callback(err);
              });
            },
            function(callback) {
              // get number of products sold by seller
              transaction.countSoldProductBySeller(seller._id, function(err, count) {
                seller.sold_product = count;
                callback(err);
              });
            },
            function(callback) {
              // get if user favorited this seller
              userSeller.isUserFavoritesSeller(req.session.user, seller._id, function(err, isFav) {
                if(err) logger.error(err);
                seller_user.favorite = isFav;
                callback(err);
              });
            },
            function(callback) {
              // get this seller's final review score
              product.getAvgReviewBySeller(seller._id, function(err, final_review_obj) {
                if(err) logger.error(err);
                seller.final_review = final_review_obj.final_review;
                seller.n_review = final_review_obj.n_review;
                seller.n_product = final_review_obj.n_product;
                callback(err);
              });
            },
            function(callback) {
              // get this seller's product
              product.getProductsBySeller(seller._id, function(err, sproducts) {
                if(err) logger.error(err);
                app.async.each(sproducts, function(product, cb_p) {
                  discountInstance.getProductDiscount(product._id, product.category_id, product.seller_id, function(err, discount) {
                    if (err) logger.error(err);
                    product.discount = discount;
                    cb_p();
                  });
                }, function(err) {
                    products = sproducts;
                    callback(err);
                });
              });
            }
          
          ],
          function(err, results) {
            var recaptcha = new app.recaptcha(app.recaptcha_site_key, app.recaptcha_secret_key, app.recaptcha_is_secure, app.recaptcha_is_secure);
            res.render('shop/product.jade', {
              active : 'product',
              seller : seller,
              seller_user : seller_user,
              products : products,
              recaptcha_form: recaptcha.toHTML()
            });
          });
            
        } else {
          res.render('helpers/404.jade');
        }

      });
    // } else {
    //   res.render('helpers/404.jade');
    // }
  });
  // ++++++++++++++++++++++++++++++++++++++
};
