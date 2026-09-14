const { sequelize } = require('../config/database');
const User = require('./User');
const Diagnosis = require('./Diagnosis');
const CommunityPost = require('./CommunityPost');
const Comment = require('./Comment');
const PasswordReset = require('./PasswordReset');

User.hasMany(Diagnosis, { foreignKey: 'user_id', as: 'diagnoses' });
Diagnosis.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(CommunityPost, { foreignKey: 'user_id', as: 'posts' });
CommunityPost.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

CommunityPost.hasMany(Comment, { foreignKey: 'post_id', as: 'comments' });
Comment.belongsTo(CommunityPost, { foreignKey: 'post_id', as: 'post' });

User.hasMany(Comment, { foreignKey: 'user_id', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { sequelize, User, Diagnosis, CommunityPost, Comment, PasswordReset };
