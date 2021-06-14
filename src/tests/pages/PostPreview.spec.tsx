import { render, screen } from "@testing-library/react";
import { getPrismicClient } from "../../services/prismic";
import Post, { getStaticProps } from "../../pages/posts/preview/[slug]";
import { mocked } from "ts-jest/utils";
import { getSession, useSession } from "next-auth/client";
import { useRouter } from "next/router";

jest.mock("../../services/prismic");
jest.mock("next/router");
jest.mock("next-auth/client");

const post = {
  slug: "my-new-post",
  title: "My New Post",
  content: "<p>Post excerpt</p>",
  updatedAt: "April, 10th",
};

describe("Post page", () => {
  it("renders correctly", () => {
    const useSessionMocked = mocked(useSession);
    useSessionMocked.mockReturnValueOnce([null, false]);

    render(<Post post={post} />);

    expect(screen.getByText("My New Post")).toBeInTheDocument();
    expect(screen.getByText("Post excerpt")).toBeInTheDocument();
    expect(screen.getByText("Wanna continue reading?")).toBeInTheDocument();
  });

  it("redirects user to full post when he is subscribed", async () => {
    const useSessionMocked = mocked(useSession);
    useSessionMocked.mockReturnValueOnce([
      {
        activeSubscription: "fake-subscription",
      },
      false,
    ]);

    const pushMock = jest.fn();
    const useRouterMocked = mocked(useRouter);
    useRouterMocked.mockReturnValueOnce({
      push: pushMock,
    } as any);

    const getSessionMocked = mocked(getSession);
    getSessionMocked.mockResolvedValueOnce({
      activeSubscription: null,
    });

    render(<Post post={post} />);

    expect(pushMock).toHaveBeenCalledWith("/posts/my-new-post");
  });

  it("loads initial data with getServerSideProps", async () => {
    const getPrismicClientMocked = mocked(getPrismicClient);
    getPrismicClientMocked.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValueOnce({
        data: {
          title: [
            {
              type: "heading",
              text: "My new post",
            },
          ],
          content: [
            {
              type: "paragraph",
              text: "Post content",
            },
          ],
        },
        last_publication_date: "04=01=2021",
      }),
    } as any);

    const response = await getStaticProps({
      params: {
        slug: "my-new-post",
      },
    } as any);

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          post: {
            slug: "my-new-post",
            title: "My new post",
            content: "<p>Post content</p>",
            updatedAt: "April 01, 2021",
          },
        },
      })
    );
  });
});
