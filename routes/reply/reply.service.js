/* eslint-disable prettier/prettier */
const Post = require("../../models/post");
const User = require("../../models/user");
const Reply = require("../../models/reply");
const PostReplyRel = require("../../models/post_reply_rel");
const jwt_decode = require("jwt-decode");
const { sequelize } = require("../../models");
const { Sequelize } = require("sequelize");
const Op = Sequelize.Op;
exports.deleteReply = async (req, res, next) => {
  const t = await sequelize.transaction();
  const { token } = req.body;
  const replyId = req.params.replyId;

  const tokenUser = jwt_decode(token);
  const userId = tokenUser.id;

  try {
    const regrUser = await User.findOne({
      where: { id: userId },
      transaction: t,
    });

    const existReply = await Reply.findOne({
      where: {
        id: replyId,
      },
      transaction: t,
    });

    if (existReply && userId !== existReply.dataValues.UserId) {
      return res.status(200).json({ msg: "유효하지 않은 요청입니다." });
    }

    const postReply = await PostReplyRel.findOne({
      where: { replyId },
    });

    existReply.destroy();
    postReply.destroy();
    console.log(
      regrUser,
      "regrUser",
      existReply,
      "existReply",
      postReply,
      "postReplyList"
    );
    return res.status(200).json({ msg: `게시물 - ${replyId}에 댓글 삭제` });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};
exports.addReply = async (req, res, next) => {
  const t = await sequelize.transaction();
  const { token, comment, repClass, upReplyId } = req.body;
  const tokenUser = jwt_decode(token);
  const userId = tokenUser.id;
  const postId = req.params.postId;

  try {
    const regrUser = await User.findOne({
      where: { id: userId },
      transaction: t,
    });

    const existPost = await Post.findOne({
      where: {
        id: postId,
      },
      transaction: t,
    });

    const postReplyList = await PostReplyRel.findAll({
      where: { postId: postId },
    });

    const replyArr = [];
    postReplyList.map((v) => {
      replyArr.push(v.dataValues.replyId);
    });
    const maxOrder = await Reply.max("order", {
      where: {
        id: {
          [Op.in]: replyArr,
        },
      },
    });

    const savedReply = await Reply.create({
      comment,
      class: repClass,
      order: maxOrder + 1,
      upReplyId: upReplyId,
    }).then(function (reply) {
      reply.setUser(regrUser, { save: false });
      return reply.save();
    });

    const replyRel = await PostReplyRel.create({
      regNo: userId,
      modNo: userId,
    }).then(function (rel) {
      rel.setPost(existPost, { save: false });
      rel.setReply(savedReply, { save: false });
      return rel.save();
    });

    return res
      .status(200)
      .json({ msg: `게시물 - ${postId}에 댓글등록`, data: replyRel });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};
