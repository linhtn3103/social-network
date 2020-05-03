const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const mongoose = require('mongoose');
const Profile = require('../../models/Profile');
const User = require('../../models/Users');
//@router get api/profile/me
//@desc  Get current users profile
//@acces Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await (
      await Profile.findOne({ user: req.user.id })
    ).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});
//@router POST api/profile
//@desc  Create or update Profile
//@acces Private
router.post(
  '/',
  auth,
  [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skill is required').not().isEmpty(),
  ],

  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error.array() });
    }
    const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
    } = req.body;
    //Build profile object
    const profiledFields = {};
    profiledFields.user = req.user.id;
    if (company) profiledFields.company = company;
    if (website) profiledFields.website = website;
    if (location) profiledFields.location = location;
    if (bio) profiledFields.bio = bio;
    if (status) profiledFields.status = status;
    if (githubusername) profiledFields.githubusername = githubusername;
    if (skills) {
      profiledFields.skills = skills.split(',').map((skills) => skills.trim());
    }
    // Build Social Object
    profiledFields.social = {};
    if (youtube) profiledFields.social.youtube = youtube;
    if (facebook) profiledFields.social.facebook = facebook;
    if (twitter) profiledFields.social.twitter = twitter;
    if (linkedin) profiledFields.social.linkedin = linkedin;
    if (instagram) profiledFields.social.instagram = instagram;
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        //Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profiledFields },
          { new: true }
        );
        return res.json(profile);
      }
      //Create
      profile = new Profile(profiledFields);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);
//@router GET api/profile
//@desc  Get all profiles
//@acces Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});
//@router GET api/profile/user/:user_id
//@desc  Get profile by user ID
//@acces Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    // Check if the ID is valid
    const valid = mongoose.Types.ObjectId.isValid(req.params.user_id);
    if (!valid) {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server error');
  }
});
//@router DELETE api/profile
//@desc  Delete profile , user & posts
//@acces Private
router.delete('/', auth, async (req, res) => {
  try {
    //@ todo - remove users posts
    //Remove profiles
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findByIdAndRemove({ _id: req.user.id });
    res.json({ msg: 'User deleted' });
  } catch (error) {
    console.error(error.message);
    // Check if the ID is valid
    const valid = mongoose.Types.ObjectId.isValid(req.params.user_id);
    if (!valid) {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server error');
  }
});
//@router PUT api/profile/experience
//@desc  Add profile experience
//@acces Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],

  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error.array() });
    }
    const {
      title,
      company,
      from,
      to,
      location,
      current,
      description,
    } = req.body;
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);
//@router DELETE api/profile/experience
//@desc  Delete profile experience
//@acces Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // Get remove index
    const removedIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    //Delete remove index
    profile.experience.splice(removedIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});
//@router PUT api/profile/education
//@desc  Add profile education
//@acces Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is not empty').not().isEmpty(),
      check('degree', 'Degree is not empty').not().isEmpty(),
      check('from', 'From date is not empty').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error.array() });
    }
    const {
      school,
      degree,
      from,
      to,
      fieldofstudy,
      current,
      description,
    } = req.body;
    const newEdu = {
      school,
      degree,
      from,
      to,
      fieldofstudy,
      current,
      description,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      console.log(profile);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);
//@router DELETE api/profile/education
//@desc  Delete profile education
//@acces Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    //Find remove index
    const removedIndex = profile.education
      .map((items) => items.id)
      .indexOf(req.params.edu_id);
    //Delete remove item
    profile.education.splice(removedIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});
//@router GET api/profile/github/:username
//@desc  Get github repo from username
//@acces Public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };
    request(options, (error, response, body) => {
      if (error) console.error(error);
      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github profile found' });
      }
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
