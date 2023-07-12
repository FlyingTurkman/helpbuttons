//FEED SECTION - HERE COMME ALL THE NOTIFFICATIONS, MESSAGES and CONVERSATION LINKS FROM EXTERNAL RESOURCES
import PostCommentNew from 'components/feed/PostCommentNew';
import PostComments from 'components/feed/PostComments';
import PostMessage from 'components/feed/PostMessage';
import PostNew from 'components/feed/PostNew';
import Btn, { BtnType, ContentAlignment } from 'elements/Btn';
import Dropdown from 'elements/Dropdown/DropDown';
import t from 'i18n';
import { GlobalState, store } from 'pages';
import { useEffect, useState } from 'react';
import { alertService } from 'services/Alert';
import { Button } from 'shared/entities/button.entity';
import { Post } from 'shared/entities/post.entity';
import { DeletePost, LoadPosts } from 'state/Posts';
import { isAdmin } from 'state/Users';
import { useRef } from 'store/Store';

export default function Feed({ button }: { button: Button }) {
  const [posts, setPosts] = useState(null);
  
  const loggedInUser = useRef(
    store,
    (state: GlobalState) => state.loggedInUser,
  );
  const isButtonOwner = loggedInUser?.id == button.owner.id;

 
  const reloadPosts = () => {
    if (button && button.id) {
      store.emit(
        new LoadPosts(
          button.id,
          (posts) => setPosts(posts),
          (errorMessage) => alertService.error(errorMessage.caption),
        ),
      );
    } else {
      console.error('not button yet?');
    }
  };
  useEffect(() => {
    reloadPosts();
  }, [button]);

  // if (!feed && currentButton) {
  //   const singleFeedItem = {
  //     author: currentButton.owner,
  //     message: 'my message',
  //     created: '2023-03-02T18:40:24.126Z',
  //     modified: Date(),
  //     comments: [
  //       {
  //         author: currentButton.owner,
  //         message: 'comment from someone',
  //         created: Date(),
  //         modified: Date(),
  //       },
  //       {
  //         author: currentButton.owner,
  //         message: 'comment from someone',
  //         created: Date(),
  //         modified: Date(),
  //       },
  //     ],
  //     reactions: [
  //       {
  //         ':like:': 10,
  //         ':heart:': 5,
  //       },
  //     ],
  //   };
  //   const feed = [singleFeedItem, singleFeedItem, singleFeedItem];
  //   setFeed(feed);
  // }

  return (
    <div className="feed-container">
      {/* <div className="feed-selector">
        <Dropdown />
      </div> */}
      {loggedInUser &&
        button.id &&
        button.owner.id == loggedInUser.id && (
          <PostNew
            buttonId={button.id}
            onCreate={() => reloadPosts()}
          />
        )}
      &nbsp;
      <div className="feed-line"></div>
      <div className="feed-section">
        {posts &&
          posts.map((post, idx) => (
            <FeedElement
              key={idx}
              post={post}
              loggedInUser={loggedInUser}
              onNewComment={() => {
                reloadPosts();
              }}
              isButtonOwner={isButtonOwner}
              reloadPosts={reloadPosts}
            />
          ))}
        {!posts ||
          (posts.length == 0 && (
            <>
              {' '}
              <div className="feed__empty-message">
                {t('common.notfound', ['posts'])}
              </div>
            </>
          ))}
      </div>
    </div>
  );
}
export function FeedElement({ post, loggedInUser, onNewComment, isButtonOwner = false, reloadPosts }) {
  const [showNewCommentDialog, setShowNewCommentDialog] =
    useState(false);

    const deletePost = (postId) => {
      store.emit(new DeletePost(postId,reloadPosts, (error) => {alertService.error(error)}));
    };
  return (
    <div className="feed-element">
      <div className="card-notification">
        <PostMessage post={post} />

        <>
          <div className="card-notification__answer-btn">
            {loggedInUser && (
              <Btn
                submit={true}
                btnType={BtnType.corporative}
                caption={t('post.newComment')}
                contentAlignment={ContentAlignment.center}
                onClick={() => {
                  setShowNewCommentDialog(!showNewCommentDialog);
                }}
              />
            )}
            {(loggedInUser && (loggedInUser.id == post.author.id || isButtonOwner || isAdmin(loggedInUser)) )&& (
              <Btn
                submit={true}
                btnType={BtnType.corporative}
                caption={t('post.delete')}
                contentAlignment={ContentAlignment.center}
                onClick={() => deletePost(post.id)}
              />
            )}
          </div>

          {showNewCommentDialog && loggedInUser && (
            <PostCommentNew
              postId={post.id}
              onSubmit={() => {
                onNewComment();
                setShowNewCommentDialog(false);
              }}
            />
          )}
        </>
        <PostComments comments={post.comments} reloadPosts={reloadPosts} loggedInUser={loggedInUser}
              isButtonOwner={isButtonOwner}/>
      </div>
    </div>
  );
}
