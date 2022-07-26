import {
  ArrowDownIcon,
  ArrowUpIcon,
  BookmarkIcon,
  ChatIcon,
  DotsHorizontalIcon,
  GiftIcon,
  ShareIcon,
} from '@heroicons/react/outline'
import React, { useEffect, useState } from 'react'
import Avatar from './Avatar'
import TimeAgo from 'react-timeago'
import _ from 'lodash/fp'
import Link from 'next/link'
import { Jelly } from '@uiball/loaders'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery } from '@apollo/client'
import { GET_ALL_VOTES_BY_POST_ID } from '../graphql/queries'
import { ADD_VOTE } from '../graphql/mutations'

type Props = {
  post: Post
}

const Post = ({ post }: Props) => {
  const { data: session } = useSession<boolean>()
  const { data, loading } = useQuery(GET_ALL_VOTES_BY_POST_ID, {
    variables: {
      post_id: post?.id,
    },
  })
  const [addVote] = useMutation(ADD_VOTE, {
    refetchQueries: [GET_ALL_VOTES_BY_POST_ID, 'getVotesByPostId'],
  })
  const [vote, setVote] = useState()
  const subredditTopic = _.flow(_.get('subreddit'), _.first, _.get('topic'))

  const upVote = async (isUpvote: boolean) => {
    if (!session) {
      toast("You'll need to sign in to vote!")
      return
    }

    if (vote && isUpvote) return
    if (vote === false && !isUpvote) return

    await addVote({
      variables: {
        post_id: post.id,
        username: _.get('user.name', session),
        upvote: isUpvote,
      },
    })
  }

  const displayVotes = (data: any) => {
    const votes: Vote[] = data?.getVotesByPostId
    const displayNumber = votes?.reduce(
      (total, vote) => (vote.upvote ? (total += 1) : (total -= 1)),
      0
    )

    if (!_.size(votes)) return 0

    if (displayNumber === 0) {
      return _.get('upvote', _.first(votes)) ? 1 : -1
    }

    return displayNumber
  }

  useEffect(() => {
    const votes: Vote[] = data?.getVotesByPostId
    const vote = _.flow(
      _.find({ username: _.get('user.name', session) }),
      _.get('upvote')
    )(votes)
    setVote(vote)
  }, [data])

  if (!post)
    return (
      <div className="flex w-full items-center justify-center p-10 text-xl">
        <Jelly size={50} color="#FF4501" />
      </div>
    )

  return (
    <Link href={`/post/${post.id}`}>
      <div className="flex cursor-pointer rounded-md border border-gray-300 bg-white shadow-sm hover:border-gray-600">
        {/* votes */}
        <div className="flex flex-col items-center justify-start space-y-1 rounded-l-md bg-gray-50 p-4 text-gray-400">
          <ArrowUpIcon
            onClick={() => upVote(true)}
            className={`voteButtons hover:text-red-500 ${
              vote && 'text-red-400'
            }`}
          />
          <p className="text-black font-bold text-xs">{displayVotes(data)}</p>
          <ArrowDownIcon
            onClick={() => upVote(false)}
            className={`voteButtons hover:text-red-500 ${
              vote === false && 'text-blue-400'
            }`}
          />
        </div>
        <div>
          {/* Header */}
          <div className="p-3 pb-1">
            <div className="flex items-center space-x-2">
              <Avatar seed={post.subreddit[0]?.topic} />
              <p className="text-xs text-gray-400">
                <Link href={`/subreddit/${subredditTopic(post)}`}>
                  <span className="font-bold text-black hover:text-blue-400">
                    r/{subredditTopic(post)}
                  </span>
                </Link>
                • Posted by u/
                {post.username} <TimeAgo date={post.created_at} />
              </p>
            </div>
          </div>
          {/* Body */}
          <div className="py-4">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm font-light">{post.body}</p>
          </div>

          {/* Image */}
          <img className="w-full" src={post.image} alt="" />

          {/* Footer */}
          <div className="flex space-x-4 text-gray-400">
            <div className="postButtons">
              <ChatIcon className="h-6 w-6" />
              <p className="">{_.size(_.get('comments', post))} Comments</p>
            </div>
            <div className="postButtons">
              <GiftIcon className="h-6 w-6" />
              <p className="">Award</p>
            </div>
            <div className="postButtons">
              <ShareIcon className="h-6 w-6" />
              <p className="">Share</p>
            </div>
            <div className="postButtons">
              <BookmarkIcon className="h-6 w-6" />
              <p className="">Save</p>
            </div>
            <div className="postButtons">
              <DotsHorizontalIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default Post
